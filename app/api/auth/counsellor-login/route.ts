import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { findOrganizationByRoomId, ensureOrgCode } from "@/lib/org-code";
import { logError } from "@/lib/logger";

// In-memory rate limiting map for counsellor room fallback tracking
const counsellorAttemptMap = new Map<string, { count: number; lockedUntil: number }>();

function checkCounsellorInMemoryAttempt(emailKey: string): { isLocked: boolean; remainingSeconds: number; attemptsRemaining: number } {
  const now = Date.now();
  const record = counsellorAttemptMap.get(emailKey) || { count: 0, lockedUntil: 0 };

  if (record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { isLocked: true, remainingSeconds, attemptsRemaining: 0 };
  }

  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    record.count = 0;
    record.lockedUntil = 0;
  }

  record.count += 1;

  if (record.count >= 5) {
    record.lockedUntil = now + 3 * 60 * 1000;
    counsellorAttemptMap.set(emailKey, record);
    return { isLocked: true, remainingSeconds: 180, attemptsRemaining: 0 };
  }

  counsellorAttemptMap.set(emailKey, record);
  return { isLocked: false, remainingSeconds: 0, attemptsRemaining: 5 - record.count };
}

export async function POST(req: NextRequest) {
  let reqEmail: string | undefined;
  let reqRoomId: string | undefined;

  try {
    const body = await req.json();
    const { orgCode, email, password } = body;

    reqEmail = email;
    reqRoomId = orgCode;

    if (!orgCode || !email || !password) {
      return NextResponse.json(
        { error: "Organization Room ID, Email, and Password are all required." },
        { status: 400 }
      );
    }

    const cleanRoomId = String(orgCode).trim();
    const normalizedEmail = String(email).trim().toLowerCase();
    const trackingKey = `${cleanRoomId}:${normalizedEmail}`;

    // Check in-memory lockout status first
    const memAttempt = counsellorAttemptMap.get(trackingKey);
    if (memAttempt && memAttempt.lockedUntil > Date.now()) {
      const remainingSeconds = Math.ceil((memAttempt.lockedUntil - Date.now()) / 1000);
      const remainingMinutes = Math.max(1, Math.ceil(remainingSeconds / 60));
      return NextResponse.json(
        {
          error: `Account is locked due to 5 invalid attempts. Please try again in ${remainingMinutes} minute(s).`,
          retryAfterMinutes: remainingMinutes,
          retryAfterSeconds: remainingSeconds,
          isLocked: true,
        },
        { status: 429 }
      );
    }

    // STEP 1: Find Organization Room (Scoped Virtual Room)
    let organization = await findOrganizationByRoomId(cleanRoomId);

    if (!organization) {
      return NextResponse.json(
        {
          error: `Virtual Room ID '${cleanRoomId}' not found. Please verify your Organization Room Code with your Administrator.`,
        },
        { status: 404 }
      );
    }

    if (organization.status === "SUSPENDED") {
      return NextResponse.json(
        {
          error: `The organization workspace '${organization.name}' has been suspended. Please contact your organization administrator.`,
        },
        { status: 403 }
      );
    }

    // Ensure org has a code generated if it was created before the schema update
    if (!organization.code) {
      const code = await ensureOrgCode(organization.id, organization.name);
      organization.code = code;
    }

    const MAX_FAILED_ATTEMPTS = 5;
    const LOCKOUT_MINUTES = 3;

    // STEP 2: Tenant-Scoped User Lookup (Indexed search restricted to this organizationId)
    const user = await prisma.user.findFirst({
      where: {
        organizationId: organization.id,
        email: normalizedEmail,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: `No counsellor account found for '${normalizedEmail}' inside Organization Room '${organization.name}'. Please check your email or contact your administrator.`,
          isUserNotFound: true,
        },
        { status: 404 }
      );
    }

    const userRecord = user as any;
    const now = new Date();
    const lockedUntil: Date | null = userRecord.lockedUntil ? new Date(userRecord.lockedUntil) : null;
    const failedLoginAttempts: number = Number(userRecord.failedLoginAttempts || 0);

    if (lockedUntil && lockedUntil > now) {
      const remainingMs = lockedUntil.getTime() - now.getTime();
      const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (1000 * 60)));
      const retryAfterSeconds = Math.ceil(remainingMs / 1000);
      return NextResponse.json(
        {
          error: `Account is locked due to 5 invalid attempts. Please try again in ${remainingMinutes} minute(s).`,
          retryAfterMinutes: remainingMinutes,
          retryAfterSeconds,
          isLocked: true,
        },
        { status: 429 }
      );
    }

    // STEP 3: Password Verification
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      const isLockExpired = lockedUntil && lockedUntil <= now;
      const currentAttempts = isLockExpired ? 0 : failedLoginAttempts;
      const newFailedAttempts = currentAttempts + 1;

      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockUntilDate = new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000);
        await (prisma.user.update as any)({
          where: { id: user.id },
          data: {
            failedLoginAttempts: newFailedAttempts,
            lockedUntil: lockUntilDate,
          },
        });

        return NextResponse.json(
          {
            error: `Account locked for 3 minutes due to 5 invalid attempts. Please wait before trying again.`,
            retryAfterMinutes: LOCKOUT_MINUTES,
            retryAfterSeconds: LOCKOUT_MINUTES * 60,
            isLocked: true,
          },
          { status: 429 }
        );
      } else {
        await (prisma.user.update as any)({
          where: { id: user.id },
          data: {
            failedLoginAttempts: newFailedAttempts,
            lockedUntil: null,
          },
        });

        const attemptsRemaining = MAX_FAILED_ATTEMPTS - newFailedAttempts;
        return NextResponse.json(
          {
            error: `Invalid credentials. You have ${attemptsRemaining} attempt(s) remaining.`,
            attemptsRemaining,
          },
          { status: 401 }
        );
      }
    }

    // Reset failed attempts & lockedUntil on successful login
    if (failedLoginAttempts > 0 || lockedUntil !== null) {
      await (prisma.user.update as any)({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    // STEP 4: Issue JWT Session Token & Cookie
    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: (user.role === "ADMIN" ? "ORG_ADMIN" : user.role) as "SUPER_ADMIN" | "ORG_ADMIN" | "COUNSELLOR" | "ADMIN",
      organizationId: organization.id,
    };

    const token = await signToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      message: `Successfully authenticated into ${organization.name} room`,
      user: sessionPayload,
      organization: {
        id: organization.id,
        name: organization.name,
        code: organization.code,
        slug: organization.slug,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Counsellor Room Login error:", error);
    logError(error, "Counsellor Room Login endpoint error", { email: reqEmail, orgCode: reqRoomId });
    return NextResponse.json(
      { error: "An unexpected error occurred during room authentication." },
      { status: 500 }
    );
  }
}
