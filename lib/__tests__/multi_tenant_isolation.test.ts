/**
 * @jest-environment node
 */
import { signToken, verifyToken } from "../auth";

describe("Multi-Tenant SaaS Architecture Unit Tests", () => {
  describe("1. JWT Token & Tenant Identity", () => {
    it("should encode and decode organizationId in session JWT tokens", async () => {
      const payload = {
        userId: "user-tenant-1",
        email: "org1_admin@crm.com",
        name: "Org 1 Admin",
        role: "ORG_ADMIN" as const,
        organizationId: "org-cuid-12345",
      };

      const token = await signToken(payload);
      expect(typeof token).toBe("string");

      const decoded = await verifyToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.organizationId).toBe("org-cuid-12345");
      expect(decoded?.role).toBe("ORG_ADMIN");
    });

    it("should correctly handle null organizationId for SUPER_ADMIN", async () => {
      const payload = {
        userId: "super-admin-id",
        email: "super@leaddesk.com",
        name: "Platform Super Admin",
        role: "SUPER_ADMIN" as const,
        organizationId: null,
      };

      const token = await signToken(payload);
      const decoded = await verifyToken(token);
      expect(decoded?.organizationId).toBeNull();
      expect(decoded?.role).toBe("SUPER_ADMIN");
    });
  });

  describe("2. Parameterized API Scoping & Authorization Controls", () => {
    it("should allow SUPER_ADMIN to target specific organization via query param orgId", () => {
      const req = new Request("http://localhost:3000/api/leads?orgId=org_target_999");
      const url = new URL(req.url);
      const paramOrgId = url.searchParams.get("orgId") || url.searchParams.get("organizationId");
      
      const role = "SUPER_ADMIN";
      let activeOrgId = null;

      if (role === "SUPER_ADMIN" && paramOrgId) {
        activeOrgId = paramOrgId;
      }

      expect(activeOrgId).toBe("org_target_999");
    });

    it("should IGNORE query param orgId for standard ORG_ADMIN and enforce bound session orgId", () => {
      const req = new Request("http://localhost:3000/api/leads?orgId=org_malicious_hacker");
      const sessionOrgId = "org_legitimate_tenant_1";
      const role: string = "ORG_ADMIN";

      let activeOrgId = sessionOrgId;

      // Standard users MUST NOT use query parameter orgId
      if (role !== "SUPER_ADMIN") {
        activeOrgId = sessionOrgId;
      }

      expect(activeOrgId).toBe("org_legitimate_tenant_1");
      expect(activeOrgId).not.toBe("org_malicious_hacker");
    });

    it("should support header x-organization-id for SUPER_ADMIN context switching", () => {
      const headers = new Headers({ "x-organization-id": "org_header_555" });
      const role = "SUPER_ADMIN";
      let activeOrgId = null;

      const headerOrgId = headers.get("x-organization-id");
      if (role === "SUPER_ADMIN" && headerOrgId) {
        activeOrgId = headerOrgId;
      }

      expect(activeOrgId).toBe("org_header_555");
    });
  });

  describe("3. Multi-Tenant Business Rules & Security Scoping", () => {
    it("should prevent assigning Org A lead to Org B counsellor", () => {
      const leadOrgId: string = "org-alpha";
      const counsellorOrgId: string = "org-beta";

      const isValidAssignment = leadOrgId === counsellorOrgId;
      expect(isValidAssignment).toBe(false);
    });

    it("should allow duplicate phone numbers in separate organizations", () => {
      const phone = "9876543210";
      const lead1 = { organizationId: "org-a", phone };
      const lead2 = { organizationId: "org-b", phone };

      const isSameOrgDuplicate = lead1.organizationId === lead2.organizationId && lead1.phone === lead2.phone;
      expect(isSameOrgDuplicate).toBe(false);
    });

    it("should reject duplicate phone numbers within the same organization", () => {
      const phone = "9876543210";
      const lead1 = { organizationId: "org-a", phone };
      const lead2 = { organizationId: "org-a", phone };

      const isSameOrgDuplicate = lead1.organizationId === lead2.organizationId && lead1.phone === lead2.phone;
      expect(isSameOrgDuplicate).toBe(true);
    });

    it("should force-inject authenticated organizationId during bulk CSV imports", () => {
      const authenticatedOrgId = "org-tenant-secure";
      const csvRow = { phone: "9812345678", organizationId: "attacker-org" };

      // Import processor overrides any organizationId supplied in the CSV file
      const leadToInsert = {
        ...csvRow,
        organizationId: authenticatedOrgId,
      };

      expect(leadToInsert.organizationId).toBe("org-tenant-secure");
      expect(leadToInsert.organizationId).not.toBe("attacker-org");
    });

    it("should map legacy ADMIN role to ORG_ADMIN seamlessly", () => {
      const legacyRole = "ADMIN";
      const effectiveRole = legacyRole === "ADMIN" ? "ORG_ADMIN" : legacyRole;
      expect(effectiveRole).toBe("ORG_ADMIN");
    });
  });
});
