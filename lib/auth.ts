import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

export type UserRole = "SUPER_ADMIN" | "ORG_ADMIN" | "COUNSELLOR" | "ADMIN" | "HR" | "TEACHER" | "EMPLOYEE";

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: string | null;
  organization?: any;
}

export interface OrganizationContext {
  user: SessionUser;
  userId: string;
  organizationId: string;
  role: UserRole;
  isSuperAdmin: boolean;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "CRITICAL: JWT_SECRET environment variable is missing. Please set JWT_SECRET in your environment configuration."
    );
  }
  return new TextEncoder().encode(secret);
}
export const SESSION_COOKIE_NAME = "crm_session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: SessionUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as UserRole,
      organizationId: (payload.organizationId as string) || null,
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function requireAuthUser(allowedRoles?: UserRole[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const effectiveRole: UserRole = user.role === "ADMIN" ? "ORG_ADMIN" : user.role;
  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.includes(user.role) || allowedRoles.includes(effectiveRole);
    if (!isAllowed) {
      throw new Error("FORBIDDEN");
    }
  }
  return user;
}

export async function getOrganizationContext(
  req?: NextRequest | Request,
  allowedRoles?: UserRole[]
): Promise<OrganizationContext> {
  const sessionUser = await requireAuthUser(allowedRoles);

  let effectiveRole: UserRole = sessionUser.role === "ADMIN" ? "ORG_ADMIN" : sessionUser.role;
  const isSuperAdmin = effectiveRole === "SUPER_ADMIN";

  let targetOrgId = sessionUser.organizationId || null;

  // SUPER_ADMIN parameter override support
  if (isSuperAdmin && req) {
    try {
      const url = new URL(req.url);
      const paramOrgId = url.searchParams.get("orgId") || url.searchParams.get("organizationId");
      const headerOrgId = req.headers?.get?.("x-organization-id");
      if (paramOrgId) {
        targetOrgId = paramOrgId;
      } else if (headerOrgId) {
        targetOrgId = headerOrgId;
      }
    } catch {
      // Ignore
    }
  }

  // Database fallback if session doesn't have organizationId cached
  if (!targetOrgId && !isSuperAdmin) {
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.userId },
      select: { organizationId: true },
    });
    targetOrgId = dbUser?.organizationId || null;
  }

  if (!targetOrgId && !isSuperAdmin) {
    throw new Error("ORGANIZATION_REQUIRED");
  }

  return {
    user: sessionUser,
    userId: sessionUser.userId,
    organizationId: targetOrgId || "",
    role: effectiveRole,
    isSuperAdmin,
  };
}

