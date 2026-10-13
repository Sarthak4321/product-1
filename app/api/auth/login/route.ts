import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, SESSION_COOKIE_NAME, UserRole } from "@/lib/auth";
import { logError } from "@/lib/logger";

export async function POST(req: NextRequest) {
  let reqEmail: string | undefined;
  try {
    const body = await req.json();
    const { email, password } = body;
    reqEmail = email;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const MAX_FAILED_ATTEMPTS = 5;
    const LOCKOUT_MINUTES = 3;
    const cleanEmail = String(email).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "No account found with this email address. Please create or register your workspace first.",
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
          error: `Account is locked due to 5 invalid password attempts. Please try again in ${remainingMinutes} minute(s).`,
          retryAfterMinutes: remainingMinutes,
          retryAfterSeconds,
          isLocked: true,
        },
        { status: 429 }
      );
    }

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

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: (user.role === "ADMIN" ? "ORG_ADMIN" : user.role) as UserRole,
      organizationId: (user as any).organizationId || null,
    };

    const token = await signToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
    });

    // Set HTTP-only secure cookie
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
    console.error("Login catch error:", error);
    logError(error, "Login endpoint error", { email: reqEmail });
    return NextResponse.json(
      { error: "An unexpected error occurred during login" },
      { status: 500 }
    );
  }
}
