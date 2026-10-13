/**
 * @jest-environment node
 */
import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  getSessionUser,
  requireAuthUser,
  getOrganizationContext,
  SESSION_COOKIE_NAME,
  SessionUser,
} from "../auth";
import { cookies } from "next/headers";
import { prisma } from "../prisma";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

jest.mock("../prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe("Comprehensive Auth Utilities Test Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("1. Password Hashing & Verification", () => {
    it("should hash a password and correctly verify it against match", async () => {
      const raw = "SuperSecretPassword123!";
      const hash = await hashPassword(raw);

      expect(hash).not.toBe(raw);
      expect(hash.startsWith("$2")).toBe(true);

      const isValid = await verifyPassword(raw, hash);
      expect(isValid).toBe(true);
    });

    it("should return false for mismatched password", async () => {
      const raw = "SuperSecretPassword123!";
      const hash = await hashPassword(raw);

      const isValid = await verifyPassword("WrongPassword!", hash);
      expect(isValid).toBe(false);
    });

    it("should handle empty or special character strings safely", async () => {
      const emptyHash = await hashPassword("");
      expect(await verifyPassword("", emptyHash)).toBe(true);
      expect(await verifyPassword("a", emptyHash)).toBe(false);

      const utf8String = "🔐パスワード123#Special!🌟";
      const utf8Hash = await hashPassword(utf8String);
      expect(await verifyPassword(utf8String, utf8Hash)).toBe(true);
    });
  });

  describe("2. JWT Signing & Verification", () => {
    it("should sign and verify valid JWT tokens for standard ORG_ADMIN user", async () => {
      const payload: SessionUser = {
        userId: "user-admin-001",
        email: "admin@coaching.org",
        name: "Admin User",
        role: "ORG_ADMIN",
        organizationId: "org-alpha-123",
      };

      const token = await signToken(payload);
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3);

      const decoded = await verifyToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.email).toBe(payload.email);
      expect(decoded?.name).toBe(payload.name);
      expect(decoded?.role).toBe(payload.role);
      expect(decoded?.organizationId).toBe("org-alpha-123");
    });

    it("should sign and verify valid JWT token for COUNSELLOR", async () => {
      const payload: SessionUser = {
        userId: "user-counsellor-002",
        email: "priya@coaching.org",
        name: "Priya Sharma",
        role: "COUNSELLOR",
        organizationId: "org-alpha-123",
      };

      const token = await signToken(payload);
      const decoded = await verifyToken(token);
      expect(decoded?.role).toBe("COUNSELLOR");
    });

    it("should sign and verify SUPER_ADMIN with null organizationId", async () => {
      const payload: SessionUser = {
        userId: "user-super-000",
        email: "root@leaddesk.com",
        name: "System Super Admin",
        role: "SUPER_ADMIN",
        organizationId: null,
      };

      const token = await signToken(payload);
      const decoded = await verifyToken(token);
      expect(decoded?.role).toBe("SUPER_ADMIN");
      expect(decoded?.organizationId).toBeNull();
    });

    it("should return null for malformed, tampered, or expired tokens", async () => {
      expect(await verifyToken("not.a.valid.jwt")).toBeNull();
      expect(await verifyToken("")).toBeNull();

      // Tampered payload in a valid token
      const validToken = await signToken({
        userId: "u1",
        email: "u1@test.com",
        name: "U1",
        role: "ORG_ADMIN",
        organizationId: "org1",
      });
      const tamperedToken = validToken.slice(0, -10) + "tampered00";
      expect(await verifyToken(tamperedToken)).toBeNull();
    });
  });

  describe("3. getSessionUser via Next.js cookies()", () => {
    it("should return null if no session cookie exists", async () => {
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue(undefined),
      });

      const user = await getSessionUser();
      expect(user).toBeNull();
    });

    it("should return SessionUser if valid token in cookie", async () => {
      const payload: SessionUser = {
        userId: "u100",
        email: "test@org.com",
        name: "Test User",
        role: "ORG_ADMIN",
        organizationId: "org-100",
      };
      const token = await signToken(payload);

      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockImplementation((name: string) => {
          if (name === SESSION_COOKIE_NAME) return { value: token };
          return undefined;
        }),
      });

      const user = await getSessionUser();
      expect(user).not.toBeNull();
      expect(user?.userId).toBe("u100");
    });

    it("should catch and return null if cookies() throws", async () => {
      (cookies as jest.Mock).mockImplementation(() => {
        throw new Error("Cookies context unavailable");
      });

      const user = await getSessionUser();
      expect(user).toBeNull();
    });
  });

  describe("4. requireAuthUser Role Enforcement", () => {
    it("should throw UNAUTHORIZED if no session exists", async () => {
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue(undefined),
      });

      await expect(requireAuthUser()).rejects.toThrow("UNAUTHORIZED");
    });

    it("should succeed when user is authenticated with no role restriction", async () => {
      const payload: SessionUser = {
        userId: "u-emp",
        email: "emp@org.com",
        name: "Employee",
        role: "EMPLOYEE",
        organizationId: "org-1",
      };
      const token = await signToken(payload);
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: token }),
      });

      const user = await requireAuthUser();
      expect(user.userId).toBe("u-emp");
    });

    it("should succeed when user role matches allowedRoles", async () => {
      const payload: SessionUser = {
        userId: "u-admin",
        email: "admin@org.com",
        name: "Admin",
        role: "ORG_ADMIN",
        organizationId: "org-1",
      };
      const token = await signToken(payload);
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: token }),
      });

      const user = await requireAuthUser(["ORG_ADMIN", "SUPER_ADMIN"]);
      expect(user.role).toBe("ORG_ADMIN");
    });

    it("should map legacy ADMIN role to ORG_ADMIN during role check", async () => {
      const payload: SessionUser = {
        userId: "u-legacy",
        email: "legacy@org.com",
        name: "Legacy Admin",
        role: "ADMIN",
        organizationId: "org-1",
      };
      const token = await signToken(payload);
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: token }),
      });

      const user = await requireAuthUser(["ORG_ADMIN"]);
      expect(user.role).toBe("ADMIN");
    });

    it("should throw FORBIDDEN when user role is not allowed", async () => {
      const payload: SessionUser = {
        userId: "u-counsellor",
        email: "counsellor@org.com",
        name: "Counsellor",
        role: "COUNSELLOR",
        organizationId: "org-1",
      };
      const token = await signToken(payload);
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: token }),
      });

      await expect(requireAuthUser(["ORG_ADMIN", "SUPER_ADMIN"])).rejects.toThrow("FORBIDDEN");
    });
  });

  describe("5. getOrganizationContext & Multi-Tenant Scoping", () => {
    it("should extract organizationId from token for standard tenant user", async () => {
      const payload: SessionUser = {
        userId: "u-counsellor",
        email: "counsellor@org.com",
        name: "Counsellor",
        role: "COUNSELLOR",
        organizationId: "org-tenant-abc",
      };
      const token = await signToken(payload);
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: token }),
      });

      const ctx = await getOrganizationContext();
      expect(ctx.organizationId).toBe("org-tenant-abc");
      expect(ctx.isSuperAdmin).toBe(false);
      expect(ctx.userId).toBe("u-counsellor");
    });

    it("should allow SUPER_ADMIN to override organizationId via query param ?orgId", async () => {
      const payload: SessionUser = {
        userId: "u-super",
        email: "super@admin.com",
        name: "Super Admin",
        role: "SUPER_ADMIN",
        organizationId: null,
      };
      const token = await signToken(payload);
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: token }),
      });

      const req = new Request("http://localhost:3000/api/leads?orgId=org-target-999");
      const ctx = await getOrganizationContext(req);
      expect(ctx.isSuperAdmin).toBe(true);
      expect(ctx.organizationId).toBe("org-target-999");
    });

    it("should allow SUPER_ADMIN to override organizationId via header x-organization-id", async () => {
      const payload: SessionUser = {
        userId: "u-super",
        email: "super@admin.com",
        name: "Super Admin",
        role: "SUPER_ADMIN",
        organizationId: null,
      };
      const token = await signToken(payload);
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: token }),
      });

      const req = new Request("http://localhost:3000/api/leads", {
        headers: { "x-organization-id": "org-header-777" },
      });
      const ctx = await getOrganizationContext(req);
      expect(ctx.isSuperAdmin).toBe(true);
      expect(ctx.organizationId).toBe("org-header-777");
    });

    it("should fetch organizationId from DB if missing in token payload for standard user", async () => {
      const payload: SessionUser = {
        userId: "u-notokenorg",
        email: "admin@org.com",
        name: "Admin",
        role: "ORG_ADMIN",
        organizationId: null,
      };
      const token = await signToken(payload);
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: token }),
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        organizationId: "org-db-fetched-888",
      });

      const ctx = await getOrganizationContext();
      expect(ctx.organizationId).toBe("org-db-fetched-888");
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "u-notokenorg" },
        select: { organizationId: true },
      });
    });

    it("should throw ORGANIZATION_REQUIRED if standard user has no organizationId in token or DB", async () => {
      const payload: SessionUser = {
        userId: "u-orphan",
        email: "orphan@org.com",
        name: "Orphan User",
        role: "ORG_ADMIN",
        organizationId: null,
      };
      const token = await signToken(payload);
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: token }),
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(getOrganizationContext()).rejects.toThrow("ORGANIZATION_REQUIRED");
    });
  });
});
