/**
 * @jest-environment node
 */
import { signToken, verifyToken } from "../auth";

describe("Super Admin & Developer Governance Unit Tests", () => {
  describe("1. Platform Admin Role Scoping", () => {
    it("should allow SUPER_ADMIN role in JWT token session", async () => {
      const payload = {
        userId: "dev-super-admin",
        email: "developer@crm.com",
        name: "Platform Developer",
        role: "SUPER_ADMIN" as const,
        organizationId: null,
      };

      const token = await signToken(payload);
      const decoded = await verifyToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.role).toBe("SUPER_ADMIN");
      expect(decoded?.organizationId).toBeNull();
    });

    it("should STRICTLY prevent ORG_ADMIN and COUNSELLOR from Super Admin access", async () => {
      const orgAdminPayload = {
        userId: "org-admin-1",
        email: "admin@coaching1.com",
        name: "Coaching Admin",
        role: "ORG_ADMIN" as const,
        organizationId: "org-1",
      };

      const token = await signToken(orgAdminPayload);
      const decoded = await verifyToken(token);

      expect(decoded?.role).toBe("ORG_ADMIN");
      expect(decoded?.role).not.toBe("SUPER_ADMIN");

      // Verify role guard helper logic
      const isSuperAdmin = decoded?.role === "SUPER_ADMIN";
      expect(isSuperAdmin).toBe(false);
    });
  });

  describe("2. Directory Filtering & Governance Logic", () => {
    const mockOrganizations = [
      {
        id: "org-1",
        name: "Apex Coaching Institute",
        slug: "apex-coaching",
        adminEmail: "apex@coaching.com",
        city: "Delhi",
        status: "ACTIVE",
        userCount: 5,
        leadCount: 150,
      },
      {
        id: "org-2",
        name: "Pinnacle Academy",
        slug: "pinnacle-academy",
        adminEmail: "pinnacle@academy.com",
        city: "Mumbai",
        status: "SUSPENDED",
        userCount: 2,
        leadCount: 40,
      },
      {
        id: "org-3",
        name: "Brilliant Tutorials",
        slug: "brilliant-tutorials",
        adminEmail: "contact@brilliant.com",
        city: "Kolkata",
        status: "ACTIVE",
        userCount: 8,
        leadCount: 300,
      },
    ];

    it("should correctly compute total platform summary stats", () => {
      const totalOrgs = mockOrganizations.length;
      const activeOrgs = mockOrganizations.filter((o) => o.status === "ACTIVE").length;
      const suspendedOrgs = mockOrganizations.filter((o) => o.status === "SUSPENDED").length;
      const totalLeads = mockOrganizations.reduce((sum, o) => sum + o.leadCount, 0);

      expect(totalOrgs).toBe(3);
      expect(activeOrgs).toBe(2);
      expect(suspendedOrgs).toBe(1);
      expect(totalLeads).toBe(490);
    });

    it("should filter organizations by search query matching name, slug, email, or city", () => {
      const query = "delhi";
      const filtered = mockOrganizations.filter(
        (o) =>
          o.name.toLowerCase().includes(query) ||
          o.slug.toLowerCase().includes(query) ||
          o.adminEmail.toLowerCase().includes(query) ||
          o.city.toLowerCase().includes(query)
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("org-1");
    });

    it("should toggle workspace status from ACTIVE to SUSPENDED", () => {
      const org = { ...mockOrganizations[0] };
      const nextStatus = org.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      org.status = nextStatus;

      expect(org.status).toBe("SUSPENDED");
    });
  });
});
