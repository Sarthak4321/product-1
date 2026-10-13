import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { logError } from "@/lib/logger";
import { generateOrgCode } from "@/lib/org-code";

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return base ? `${base}-${randomSuffix}` : `org-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  let reqEmail: string | undefined;
  try {
    const body = await req.json();
    const {
      name,
      slug: customSlug,
      email,
      phone,
      city,
      state,
      zipCode,
      adminName,
      adminEmail,
      password,
      confirmPassword,
    } = body;

    reqEmail = adminEmail || email;

    if (!name || !adminName || !adminEmail || !password) {
      return NextResponse.json(
        { error: "Organization name, Admin name, Admin email, and Password are required." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword && confirmPassword !== undefined) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const normalizedAdminEmail = String(adminEmail).trim().toLowerCase();

    // Check if user email already exists globally
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedAdminEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user account with this email address already exists." },
        { status: 409 }
      );
    }

    let slug = customSlug
      ? String(customSlug)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9-]/g, "")
      : generateSlug(name);

    if (!slug) {
      slug = generateSlug(name);
    }

    // Ensure slug uniqueness
    const existingSlug = await prisma.organization.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    let code = generateOrgCode(name);
    let existingCode = await prisma.organization.findUnique({ where: { code } });
    while (existingCode) {
      code = generateOrgCode(name);
      existingCode = await prisma.organization.findUnique({ where: { code } });
    }

    const passwordHash = await hashPassword(password);

    // ATOMIC TRANSACTION: Create Organization + Initial ORG_ADMIN User
    const { organization, adminUser } = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: String(name).trim(),
          slug,
          code,
          email: email ? String(email).trim() : normalizedAdminEmail,
          phone: phone ? String(phone).trim() : null,
          city: city ? String(city).trim() : null,
          state: state ? String(state).trim() : null,
          zipCode: zipCode ? String(zipCode).trim() : null,
          status: "ACTIVE",
        },
      });

      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          name: String(adminName).trim(),
          email: normalizedAdminEmail,
          passwordHash,
          role: "ORG_ADMIN",
        },
      });

      return { organization: org, adminUser: user };
    });

    const sessionPayload = {
      userId: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role as "ORG_ADMIN",
      organizationId: organization.id,
    };

    const token = await signToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      message: "Workspace created successfully.",
      user: sessionPayload,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        code: organization.code,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    logError(error, "Organization registration error", { email: reqEmail });
    return NextResponse.json(
      { error: "An unexpected error occurred during workspace registration." },
      { status: 500 }
    );
  }
}
