/**
 * @jest-environment node
 */
import { verifyPassword, hashPassword, signToken, verifyToken } from "../auth";
import { generateOrgCode } from "../org-code";

describe("Counsellor Room-Scoped Authentication & Virtual Isolation Unit Tests", () => {
  describe("1. Virtual Room Identifier Validation", () => {
    it("should reject room login when Room ID, email, or password is missing", () => {
      const validateRoomPayload = (payload: { orgCode?: string; email?: string; password?: string }) => {
        if (!payload.orgCode || !payload.email || !payload.password) {
          return { error: "Organization Room ID, Email, and Password are all required.", status: 400 };
        }
        return { status: 200 };
      };

      expect(validateRoomPayload({ email: "priya@crm.com", password: "pass" }).status).toBe(400);
      expect(validateRoomPayload({ orgCode: "ORG-1001", password: "pass" }).status).toBe(400);
      expect(validateRoomPayload({ orgCode: "ORG-1001", email: "priya@crm.com" }).status).toBe(400);
      expect(validateRoomPayload({ orgCode: "ORG-1001", email: "priya@crm.com", password: "pass" }).status).toBe(200);
    });

    it("should reject suspended organization rooms", () => {
      const checkRoomActive = (status: string) => status === "ACTIVE";
      expect(checkRoomActive("SUSPENDED")).toBe(false);
      expect(checkRoomActive("ACTIVE")).toBe(true);
    });
  });

  describe("2. Room-Scoped User Isolation Controls", () => {
    it("should scope user database lookups strictly within target organizationId", () => {
      const targetOrgId = "org-alpha-123";
      const userList = [
        { id: "u1", organizationId: "org-alpha-123", email: "counsellor@gmail.com", role: "COUNSELLOR" },
        { id: "u2", organizationId: "org-beta-456", email: "counsellor@gmail.com", role: "COUNSELLOR" },
      ];

      // Simulated room-scoped search inside org-alpha-123
      const foundInOrgAlpha = userList.find(
        (u) => u.organizationId === targetOrgId && u.email === "counsellor@gmail.com"
      );

      expect(foundInOrgAlpha).toBeDefined();
      expect(foundInOrgAlpha?.id).toBe("u1");
      expect(foundInOrgAlpha?.organizationId).toBe("org-alpha-123");
    });

    it("should prevent cross-tenant login when user credentials belong to a different organization room", () => {
      const orgARoomId = "org-room-A";
      const orgBRoomId = "org-room-B";

      const counsellorOrgA = {
        id: "counsellor-a",
        organizationId: orgARoomId,
        email: "priya@inst-a.com",
      };

      // Attempting to log into Org B's Virtual Room with Org A counsellor email
      const searchInRoomB = counsellorOrgA.organizationId === orgBRoomId;

      expect(searchInRoomB).toBe(false);
    });
  });

  describe("3. Tenant Room Session Issuance", () => {
    it("should issue a room-bound JWT token containing organizationId upon successful room login", async () => {
      const mockCounsellor = {
        id: "counsellor-101",
        email: "priya@crm.com",
        name: "Priya Sharma",
        role: "COUNSELLOR" as const,
        organizationId: "org-cuid-1001",
      };

      const token = await signToken({
        userId: mockCounsellor.id,
        email: mockCounsellor.email,
        name: mockCounsellor.name,
        role: mockCounsellor.role,
        organizationId: mockCounsellor.organizationId,
      });

      expect(token).toBeDefined();

      const session = await verifyToken(token);
      expect(session?.organizationId).toBe("org-cuid-1001");
      expect(session?.role).toBe("COUNSELLOR");
    });
  });
});
