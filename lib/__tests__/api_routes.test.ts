/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET as getLeads, POST as createLead, DELETE as deleteLeads, PATCH as bulkUpdateLeads } from "@/app/api/leads/route";
import { GET as getLeadById, PATCH as updateLeadById } from "@/app/api/leads/[id]/route";
import { GET as getNextLead } from "@/app/api/leads/next/route";
import { POST as logWhatsAppActivity } from "@/app/api/leads/[id]/whatsapp/route";
import { POST as previewCsvImport } from "@/app/api/leads/import/preview/route";
import { POST as confirmCsvImport } from "@/app/api/leads/import/confirm/route";
import { GET as getCounsellors, POST as createCounsellor } from "@/app/api/counsellors/route";
import { DELETE as deleteCounsellorById } from "@/app/api/counsellors/[id]/route";
import { GET as getCounsellorLeads, POST as assignCounsellorLeads, DELETE as unassignCounsellorLeads } from "@/app/api/counsellors/[id]/leads/route";
import { GET as getCounsellorActivities } from "@/app/api/counsellors/[id]/activities/route";
import { GET as getAdminAnalytics } from "@/app/api/admin/analytics/route";
import { GET as getAdminLogs, POST as postAdminTestLog } from "@/app/api/admin/logs/route";
import { GET as getOrgSettings, PATCH as updateOrgSettings } from "@/app/api/organization/settings/route";
import { GET as getSuperAdminOrgs, PATCH as updateSuperAdminOrg } from "@/app/api/super-admin/organizations/route";
import { GET as getSuperAdminLogs, POST as postSuperAdminTestLog } from "@/app/api/super-admin/logs/route";
import { GET as getEmployees, POST as createEmployee } from "@/app/api/hr/employees/route";
import { GET as getEmployeeById, PATCH as updateEmployeeById, DELETE as deleteEmployeeById } from "@/app/api/hr/employees/[id]/route";
import { GET as getDepartments, POST as createDepartment } from "@/app/api/hr/departments/route";
import { GET as getDesignations, POST as createDesignation } from "@/app/api/hr/designations/route";
import { GET as getMetrics } from "@/app/api/metrics/route";
import { POST as authLogin } from "@/app/api/auth/login/route";
import { POST as counsellorLogin } from "@/app/api/auth/counsellor-login/route";
import { POST as authRegister } from "@/app/api/auth/register/route";
import { GET as authMe } from "@/app/api/auth/me/route";
import { POST as authLogout } from "@/app/api/auth/logout/route";

import { prisma } from "@/lib/prisma";
import * as authLib from "@/lib/auth";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    lead: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    organization: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    leadActivity: {
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    whatsAppActivity: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    systemErrorLog: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn().mockResolvedValue({}),
    },
    employee: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    department: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    designation: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((input) => {
      if (typeof input === "function") {
        return input(prisma);
      }
      return Promise.all(input);
    }),
  },
}));

jest.mock("@/lib/auth", () => {
  const actual = jest.requireActual("@/lib/auth");
  return {
    ...actual,
    getOrganizationContext: jest.fn(),
    getSessionUser: jest.fn(),
    requireAuthUser: jest.fn(),
  };
});

describe("CRM App Router API Routes Comprehensive Unit & Integration Tests", () => {
  const mockOrgAdminContext = {
    user: {
      userId: "admin-user-id",
      email: "admin@crm.com",
      name: "Admin User",
      role: "ORG_ADMIN" as const,
      organizationId: "org-test-1",
    },
    userId: "admin-user-id",
    organizationId: "org-test-1",
    role: "ORG_ADMIN" as const,
    isSuperAdmin: false,
  };

  const mockCounsellorContext = {
    user: {
      userId: "counsellor-user-id",
      email: "priya@crm.com",
      name: "Priya Counsellor",
      role: "COUNSELLOR" as const,
      organizationId: "org-test-1",
    },
    userId: "counsellor-user-id",
    organizationId: "org-test-1",
    role: "COUNSELLOR" as const,
    isSuperAdmin: false,
  };

  const mockSuperAdminContext = {
    user: {
      userId: "super-user-id",
      email: "super@admin.com",
      name: "Super Admin",
      role: "SUPER_ADMIN" as const,
      organizationId: null,
    },
    userId: "super-user-id",
    organizationId: "org-test-1",
    role: "SUPER_ADMIN" as const,
    isSuperAdmin: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (authLib.getOrganizationContext as jest.Mock).mockResolvedValue(mockOrgAdminContext);
    (authLib.getSessionUser as jest.Mock).mockResolvedValue(mockOrgAdminContext.user);
    (authLib.requireAuthUser as jest.Mock).mockResolvedValue(mockOrgAdminContext.user);
  });

  // ==========================================
  // 1. LEADS API ROUTES (/api/leads)
  // ==========================================
  describe("1. Leads API (/api/leads)", () => {
    it("GET /api/leads - should return paginated leads and status counts for ORG_ADMIN", async () => {
      (prisma.lead.findMany as jest.Mock).mockResolvedValueOnce([
        { id: "lead-1", name: "Rahul", phone: "919876543210", status: "NEW" },
      ]);
      (prisma.lead.count as jest.Mock).mockResolvedValueOnce(1);
      (prisma.lead.groupBy as jest.Mock).mockResolvedValueOnce([{ status: "NEW", _count: { _all: 1 } }]);
      (prisma.lead.count as jest.Mock).mockResolvedValueOnce(0);

      const req = new NextRequest("http://localhost:3000/api/leads?page=1&limit=20");
      const res = await getLeads(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.leads.length).toBe(1);
      expect(data.pagination.total).toBe(1);
      expect(data.pagination.countsMap.NEW).toBe(1);
    });

    it("POST /api/leads - should validate phone number and create a new lead", async () => {
      (prisma.lead.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (prisma.lead.create as jest.Mock).mockResolvedValueOnce({
        id: "new-lead-id",
        name: "Aman",
        phone: "919812345678",
        status: "NEW",
        organizationId: "org-test-1",
      });
      (prisma.leadActivity.create as jest.Mock).mockResolvedValueOnce({});

      const req = new NextRequest("http://localhost:3000/api/leads", {
        method: "POST",
        body: JSON.stringify({
          phone: "9812345678",
          name: "Aman",
          course: "NEET",
        }),
      });

      const res = await createLead(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.lead.name).toBe("Aman");
      expect(data.lead.phone).toBe("919812345678");
    });

    it("POST /api/leads - should return 409 for duplicate phone number in same org", async () => {
      (prisma.lead.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "existing-lead-id",
        phone: "919812345678",
        organizationId: "org-test-1",
      });

      const req = new NextRequest("http://localhost:3000/api/leads", {
        method: "POST",
        body: JSON.stringify({ phone: "9812345678", name: "Aman Duplicate" }),
      });

      const res = await createLead(req);
      const data = await res.json();

      expect(res.status).toBe(409);
      expect(data.error).toContain("already exists");
    });

    it("DELETE /api/leads - should bulk delete leads", async () => {
      (prisma.lead.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 3 });

      const req = new NextRequest("http://localhost:3000/api/leads", {
        method: "DELETE",
        body: JSON.stringify({ leadIds: ["l1", "l2", "l3"] }),
      });

      const res = await deleteLeads(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("3 leads");
    });

    it("DELETE /api/leads?id=lead-123 - should delete single lead", async () => {
      (prisma.lead.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 1 });

      const req = new NextRequest("http://localhost:3000/api/leads?id=lead-123", { method: "DELETE" });
      const res = await deleteLeads(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("PATCH /api/leads - should bulk update lead status", async () => {
      (prisma.lead.updateMany as jest.Mock).mockResolvedValueOnce({ count: 2 });

      const req = new NextRequest("http://localhost:3000/api/leads", {
        method: "PATCH",
        body: JSON.stringify({ leadIds: ["l1", "l2"], status: "CONTACTED" }),
      });

      const res = await bulkUpdateLeads(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  // ==========================================
  // 2. SINGLE LEAD API (/api/leads/[id])
  // ==========================================
  describe("2. Single Lead API (/api/leads/[id])", () => {
    it("GET /api/leads/[id] - should fetch lead details and activities", async () => {
      (prisma.lead.findFirst as jest.Mock).mockReset();
      (prisma.lead.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "lead-123",
        name: "Karan",
        phone: "919999988888",
        status: "NEW",
        activities: [],
      });

      const req = new NextRequest("http://localhost:3000/api/leads/lead-123");
      const res = await getLeadById(req, { params: { id: "lead-123" } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.lead.name).toBe("Karan");
    });

    it("GET /api/leads/[id] - should return 404 if lead not found", async () => {
      (prisma.lead.findFirst as jest.Mock).mockReset();
      (prisma.lead.findFirst as jest.Mock).mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost:3000/api/leads/missing-id");
      const res = await getLeadById(req, { params: { id: "missing-id" } });
      expect(res.status).toBe(404);
    });

    it("PATCH /api/leads/[id] - should update lead status and create activity log", async () => {
      (prisma.lead.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "lead-123",
        status: "NEW",
        organizationId: "org-test-1",
      });
      (prisma.lead.update as jest.Mock).mockResolvedValueOnce({
        id: "lead-123",
        status: "INTERESTED",
      });
      (prisma.leadActivity.create as jest.Mock).mockResolvedValueOnce({});

      const req = new NextRequest("http://localhost:3000/api/leads/lead-123", {
        method: "PATCH",
        body: JSON.stringify({ status: "INTERESTED", notes: "Discussed fee structure" }),
      });

      const res = await updateLeadById(req, { params: { id: "lead-123" } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.lead.status).toBe("INTERESTED");
    });
  });

  // ==========================================
  // 3. NEXT LEAD QUEUE (/api/leads/next)
  // ==========================================
  describe("3. Next Lead Queue (/api/leads/next)", () => {
    it("GET /api/leads/next - should prioritize follow-up leads over new leads", async () => {
      (authLib.getOrganizationContext as jest.Mock).mockResolvedValue(mockCounsellorContext);
      (prisma.lead.findFirst as jest.Mock).mockReset();
      (prisma.lead.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "followup-lead-1",
        phone: "919876543210",
        name: "Follow-up Candidate",
        status: "FOLLOW_UP",
      });

      const req = new NextRequest("http://localhost:3000/api/leads/next");
      const res = await getNextLead(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.lead.name).toBe("Follow-up Candidate");
      expect(data.reason).toBe("DUE_FOLLOW_UP");
    });

    it("GET /api/leads/next - should return next new assigned lead if no follow-ups due", async () => {
      (authLib.getOrganizationContext as jest.Mock).mockResolvedValue(mockCounsellorContext);
      (prisma.lead.findFirst as jest.Mock).mockReset();
      (prisma.lead.findFirst as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: "new-lead-2",
          phone: "919876543211",
          name: "Fresh Inquirer",
          status: "NEW",
        });

      const req = new NextRequest("http://localhost:3000/api/leads/next");
      const res = await getNextLead(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.lead.name).toBe("Fresh Inquirer");
      expect(data.reason).toBe("ASSIGNED_NEW");
    });

    it("GET /api/leads/next - should return 200 with lead: null when queue is empty", async () => {
      (authLib.getOrganizationContext as jest.Mock).mockResolvedValue(mockCounsellorContext);
      (prisma.lead.findFirst as jest.Mock).mockReset();
      (prisma.lead.findFirst as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/leads/next");
      const res = await getNextLead(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.lead).toBeNull();
    });
  });

  // ==========================================
  // 4. WHATSAPP LOGGING (/api/leads/[id]/whatsapp)
  // ==========================================
  describe("4. WhatsApp Activity Logging (/api/leads/[id]/whatsapp)", () => {
    it("POST /api/leads/[id]/whatsapp - should record WhatsApp message and create activity", async () => {
      (prisma.lead.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "lead-wa-1",
        organizationId: "org-test-1",
      });
      (prisma.whatsAppActivity.create as jest.Mock).mockResolvedValueOnce({
        id: "wa-act-1",
        message: "Hello Student, please attend trial class.",
      });
      (prisma.lead.update as jest.Mock).mockResolvedValueOnce({});

      const req = new NextRequest("http://localhost:3000/api/leads/lead-wa-1/whatsapp", {
        method: "POST",
        body: JSON.stringify({
          message: "Hello Student, please attend trial class.",
        }),
      });

      const res = await logWhatsAppActivity(req, { params: { id: "lead-wa-1" } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  // ==========================================
  // 5. CSV IMPORT PREVIEW & CONFIRM
  // ==========================================
  describe("5. CSV Bulk Import Preview & Confirm (/api/leads/import/*)", () => {
    it("POST /api/leads/import/preview - should parse CSV and detect valid and invalid rows", async () => {
      (prisma.lead.findMany as jest.Mock).mockResolvedValueOnce([]);

      const csv = `phone,name,course
9876543210,Rohit,JEE
9876543211,Simran,NEET
invalid-phone,Bad,Test`;

      const req = new NextRequest("http://localhost:3000/api/leads/import/preview", {
        method: "POST",
        body: JSON.stringify({ csvContent: csv }),
      });

      const res = await previewCsvImport(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.summary.totalRows).toBe(3);
      expect(data.summary.validCount).toBe(2);
      expect(data.summary.invalidCount).toBe(1);
    });

    it("POST /api/leads/import/confirm - should insert valid leads scoped to organizationId", async () => {
      (prisma.lead.findMany as jest.Mock).mockResolvedValueOnce([]);
      (prisma.lead.createMany as jest.Mock).mockResolvedValueOnce({ count: 2 });
      (prisma.leadActivity.createMany as jest.Mock).mockResolvedValueOnce({ count: 2 });

      const req = new NextRequest("http://localhost:3000/api/leads/import/confirm", {
        method: "POST",
        body: JSON.stringify({
          leads: [
            { phone: "919876543210", name: "Lead 1" },
            { phone: "919876543211", name: "Lead 2" },
          ],
        }),
      });

      const res = await confirmCsvImport(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.importedCount).toBe(2);
    });
  });

  // ==========================================
  // 6. COUNSELLORS API (/api/counsellors/*)
  // ==========================================
  describe("6. Counsellors API (/api/counsellors)", () => {
    it("GET /api/counsellors - should return counsellors with assigned lead counts", async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: "c-1",
          name: "Priya",
          email: "priya@crm.com",
          role: "COUNSELLOR",
          _count: { assignedLeads: 12 },
        },
      ]);

      const req = new NextRequest("http://localhost:3000/api/counsellors");
      const res = await getCounsellors(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.counsellors.length).toBe(1);
      expect(data.counsellors[0].name).toBe("Priya");
    });

    it("POST /api/counsellors - should create a new counsellor under organization", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prisma.user.create as jest.Mock).mockResolvedValueOnce({
        id: "c-new",
        name: "New Counsellor",
        email: "new_c@crm.com",
        role: "COUNSELLOR",
        organizationId: "org-test-1",
      });
      (prisma.employee.create as jest.Mock).mockResolvedValueOnce({});

      const req = new NextRequest("http://localhost:3000/api/counsellors", {
        method: "POST",
        body: JSON.stringify({
          name: "New Counsellor",
          email: "new_c@crm.com",
          password: "password123",
        }),
      });

      const res = await createCounsellor(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.counsellor.email).toBe("new_c@crm.com");
    });

    it("DELETE /api/counsellors/[id] - should delete counsellor", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "c-1",
        name: "Priya",
        role: "COUNSELLOR",
        organizationId: "org-test-1",
      });
      (prisma.user.delete as jest.Mock).mockResolvedValueOnce({});

      const req = new NextRequest("http://localhost:3000/api/counsellors/c-1", { method: "DELETE" });
      const res = await deleteCounsellorById(req, { params: { id: "c-1" } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("GET /api/counsellors/[id]/leads - should return leads assigned to counsellor", async () => {
      (prisma.user.findFirst as jest.Mock).mockReset();
      (prisma.lead.findMany as jest.Mock).mockReset();
      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "c-1",
        organizationId: "org-test-1",
      });
      (prisma.lead.findMany as jest.Mock).mockResolvedValueOnce([
        { id: "l-assigned-1", name: "Student A", status: "NEW" },
      ]);

      const req = new NextRequest("http://localhost:3000/api/counsellors/c-1/leads");
      const res = await getCounsellorLeads(req, { params: { id: "c-1" } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.leads.length).toBe(1);
    });

    it("POST /api/counsellors/[id]/leads - should assign leads to counsellor", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "c-1",
        name: "Priya",
        role: "COUNSELLOR",
        organizationId: "org-test-1",
      });
      (prisma.lead.updateMany as jest.Mock).mockResolvedValueOnce({ count: 2 });

      const req = new NextRequest("http://localhost:3000/api/counsellors/c-1/leads", {
        method: "POST",
        body: JSON.stringify({ leadIds: ["l1", "l2"] }),
      });

      const res = await assignCounsellorLeads(req, { params: { id: "c-1" } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("DELETE /api/counsellors/[id]/leads - should unassign leads from counsellor", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "c-1",
        name: "Priya",
        role: "COUNSELLOR",
        organizationId: "org-test-1",
      });
      (prisma.lead.updateMany as jest.Mock).mockResolvedValueOnce({ count: 2 });

      const req = new NextRequest("http://localhost:3000/api/counsellors/c-1/leads", {
        method: "DELETE",
        body: JSON.stringify({ leadIds: ["l1", "l2"], action: "UNASSIGN" }),
      });

      const res = await unassignCounsellorLeads(req, { params: { id: "c-1" } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("GET /api/counsellors/[id]/activities - should return counsellor activity timeline", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "c-1",
        name: "Priya",
        organizationId: "org-test-1",
      });
      (prisma.leadActivity.findMany as jest.Mock).mockResolvedValueOnce([
        { id: "act-1", type: "STATUS_CHANGE", notes: "Called parent", createdAt: new Date() },
      ]);

      const req = new NextRequest("http://localhost:3000/api/counsellors/c-1/activities");
      const res = await getCounsellorActivities(req, { params: { id: "c-1" } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.activities.length).toBe(1);
    });
  });

  // ==========================================
  // 7. ADMIN ANALYTICS & LOGS
  // ==========================================
  describe("7. Admin Analytics & Logs (/api/admin/*)", () => {
    it("GET /api/admin/analytics - should compute summary conversion metrics", async () => {
      (prisma.lead.count as jest.Mock).mockResolvedValue(10);
      (prisma.lead.groupBy as jest.Mock).mockResolvedValueOnce([
        { status: "ENROLLED", _count: { _all: 3 } },
        { status: "NEW", _count: { _all: 7 } },
      ]);
      (prisma.user.findMany as jest.Mock).mockResolvedValueOnce([]);

      const req = new NextRequest("http://localhost:3000/api/admin/analytics");
      const res = await getAdminAnalytics(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.summary).toBeDefined();
    });

    it("GET /api/admin/logs - should return audit and system error logs for tenant", async () => {
      (authLib.getOrganizationContext as jest.Mock).mockResolvedValue(mockSuperAdminContext);
      (prisma.systemErrorLog.findMany as jest.Mock).mockResolvedValueOnce([
        { id: "log-1", message: "Failed API call", level: "ERROR" },
      ]);
      (prisma.systemErrorLog.count as jest.Mock).mockResolvedValueOnce(1);

      const req = new NextRequest("http://localhost:3000/api/admin/logs");
      const res = await getAdminLogs(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.errors.length).toBe(1);
    });

    it("POST /api/admin/logs - should record a test diagnostic log", async () => {
      (authLib.getOrganizationContext as jest.Mock).mockResolvedValue(mockSuperAdminContext);

      const req = new NextRequest("http://localhost:3000/api/admin/logs", { method: "POST" });
      const res = await postAdminTestLog(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  // ==========================================
  // 8. HR & EMPLOYEE MANAGEMENT (/api/hr/*)
  // ==========================================
  describe("8. HR Employees & Org Structure API (/api/hr/*)", () => {
    it("GET /api/hr/employees - should return employee list with department and designation", async () => {
      (prisma.employee.count as jest.Mock).mockResolvedValueOnce(1);
      (prisma.employee.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: "emp-1",
          employeeId: "EMP-1001",
          firstName: "John",
          lastName: "Doe",
          email: "john@crm.com",
          status: "ACTIVE",
          department: { id: "dept-1", name: "Academics" },
          designation: { id: "desig-1", name: "Senior Faculty" },
        },
      ]);

      const req = new NextRequest("http://localhost:3000/api/hr/employees");
      const res = await getEmployees(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.employees.length).toBe(1);
      expect(data.employees[0].employeeId).toBe("EMP-1001");
    });

    it("POST /api/hr/employees - should create a new employee record", async () => {
      (prisma.employee.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (prisma.employee.count as jest.Mock).mockResolvedValueOnce(5);
      (prisma.employee.create as jest.Mock).mockResolvedValueOnce({
        id: "emp-new",
        employeeId: "EMP-1006",
        firstName: "Meera",
        lastName: "Nair",
        email: "meera@crm.com",
        status: "PROBATION",
      });

      const req = new NextRequest("http://localhost:3000/api/hr/employees", {
        method: "POST",
        body: JSON.stringify({
          firstName: "Meera",
          lastName: "Nair",
          email: "meera@crm.com",
          phone: "9876543210",
        }),
      });

      const res = await createEmployee(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.employee.firstName).toBe("Meera");
    });

    it("GET /api/hr/employees/[id] - should fetch employee details", async () => {
      (prisma.employee.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "emp-1",
        firstName: "John",
        lastName: "Doe",
      });

      const req = new NextRequest("http://localhost:3000/api/hr/employees/emp-1");
      const res = await getEmployeeById(req, { params: { id: "emp-1" } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.employee.firstName).toBe("John");
    });

    it("PATCH /api/hr/employees/[id] - should update employee status and salary", async () => {
      (prisma.employee.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "emp-1",
        organizationId: "org-test-1",
      });
      (prisma.employee.update as jest.Mock).mockResolvedValueOnce({
        id: "emp-1",
        status: "ACTIVE",
        salary: 75000,
      });

      const req = new NextRequest("http://localhost:3000/api/hr/employees/emp-1", {
        method: "PATCH",
        body: JSON.stringify({ status: "ACTIVE", salary: 75000 }),
      });

      const res = await updateEmployeeById(req, { params: { id: "emp-1" } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.employee.salary).toBe(75000);
    });

    it("DELETE /api/hr/employees/[id] - should deactivate employee", async () => {
      (prisma.employee.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "emp-1",
        organizationId: "org-test-1",
      });
      (prisma.employee.update as jest.Mock).mockResolvedValueOnce({
        id: "emp-1",
        firstName: "John",
        lastName: "Doe",
        status: "TERMINATED",
      });

      const req = new NextRequest("http://localhost:3000/api/hr/employees/emp-1", { method: "DELETE" });
      const res = await deleteEmployeeById(req, { params: { id: "emp-1" } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("GET /api/hr/departments - should list departments with employee counts", async () => {
      (prisma.department.findMany as jest.Mock).mockResolvedValueOnce([
        { id: "dept-1", name: "Admissions", _count: { employees: 4 } },
      ]);

      const req = new NextRequest("http://localhost:3000/api/hr/departments");
      const res = await getDepartments(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.departments.length).toBe(1);
    });

    it("POST /api/hr/departments - should create a department", async () => {
      (prisma.department.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prisma.department.create as jest.Mock).mockResolvedValueOnce({
        id: "dept-new",
        name: "Operations",
      });

      const req = new NextRequest("http://localhost:3000/api/hr/departments", {
        method: "POST",
        body: JSON.stringify({ name: "Operations" }),
      });

      const res = await createDepartment(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.department.name).toBe("Operations");
    });

    it("GET /api/hr/designations - should list designations", async () => {
      (prisma.designation.findMany as jest.Mock).mockResolvedValueOnce([
        { id: "desig-1", title: "Counselor", _count: { employees: 3 } },
      ]);

      const req = new NextRequest("http://localhost:3000/api/hr/designations");
      const res = await getDesignations(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.designations.length).toBe(1);
    });

    it("POST /api/hr/designations - should create designation", async () => {
      (prisma.designation.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prisma.designation.create as jest.Mock).mockResolvedValueOnce({
        id: "desig-new",
        title: "Branch Head",
      });

      const req = new NextRequest("http://localhost:3000/api/hr/designations", {
        method: "POST",
        body: JSON.stringify({ title: "Branch Head" }),
      });

      const res = await createDesignation(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.designation.title).toBe("Branch Head");
    });
  });

  // ==========================================
  // 9. ORGANIZATION SETTINGS (/api/organization/settings)
  // ==========================================
  describe("9. Organization Settings API (/api/organization/settings)", () => {
    it("GET /api/organization/settings - should fetch org profile", async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "org-test-1",
        name: "Apex Academy",
        code: "APE-1001",
        email: "apex@crm.com",
      });

      const req = new NextRequest("http://localhost:3000/api/organization/settings");
      const res = await getOrgSettings(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.organization.name).toBe("Apex Academy");
    });

    it("PATCH /api/organization/settings - should update org profile", async () => {
      (prisma.organization.update as jest.Mock).mockResolvedValueOnce({
        id: "org-test-1",
        name: "Apex Premier Institute",
      });

      const req = new NextRequest("http://localhost:3000/api/organization/settings", {
        method: "PATCH",
        body: JSON.stringify({ name: "Apex Premier Institute" }),
      });

      const res = await updateOrgSettings(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.organization.name).toBe("Apex Premier Institute");
    });
  });

  // ==========================================
  // 10. SUPER ADMIN API (/api/super-admin/*)
  // ==========================================
  describe("10. Super Admin Platform Operations (/api/super-admin/*)", () => {
    it("GET /api/super-admin/organizations - should return all tenants", async () => {
      (authLib.requireAuthUser as jest.Mock).mockResolvedValue(mockSuperAdminContext.user);
      (prisma.organization.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: "org-1",
          name: "Tenant 1",
          status: "ACTIVE",
          users: [{ name: "Admin 1", email: "admin1@crm.com", role: "ORG_ADMIN" }],
          _count: { users: 5, leads: 100, leadActivities: 20, whatsAppActivities: 10 },
        },
      ]);
      (prisma.lead.count as jest.Mock).mockResolvedValueOnce(100);
      (prisma.user.count as jest.Mock).mockResolvedValueOnce(5);
      (prisma.systemErrorLog.count as jest.Mock).mockResolvedValueOnce(0);

      const req = new NextRequest("http://localhost:3000/api/super-admin/organizations");
      const res = await getSuperAdminOrgs(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.organizations.length).toBe(1);
    });

    it("PATCH /api/super-admin/organizations - should suspend or update tenant status", async () => {
      (authLib.requireAuthUser as jest.Mock).mockResolvedValue(mockSuperAdminContext.user);
      (prisma.organization.update as jest.Mock).mockResolvedValueOnce({
        id: "org-1",
        status: "SUSPENDED",
      });

      const req = new NextRequest("http://localhost:3000/api/super-admin/organizations", {
        method: "PATCH",
        body: JSON.stringify({ organizationId: "org-1", status: "SUSPENDED" }),
      });

      const res = await updateSuperAdminOrg(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.organization.status).toBe("SUSPENDED");
    });

    it("GET /api/super-admin/logs - should return platform-wide system audit logs", async () => {
      (authLib.requireAuthUser as jest.Mock).mockResolvedValue(mockSuperAdminContext.user);
      (prisma.systemErrorLog.findMany as jest.Mock).mockResolvedValueOnce([
        { id: "log-plat-1", message: "Global error", level: "ERROR" },
      ]);
      (prisma.systemErrorLog.count as jest.Mock).mockResolvedValueOnce(1);

      const req = new NextRequest("http://localhost:3000/api/super-admin/logs");
      const res = await getSuperAdminLogs(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.errors.length).toBe(1);
    });

    it("POST /api/super-admin/logs - should trigger platform test log", async () => {
      (authLib.requireAuthUser as jest.Mock).mockResolvedValue(mockSuperAdminContext.user);

      const req = new NextRequest("http://localhost:3000/api/super-admin/logs", { method: "POST" });
      const res = await postSuperAdminTestLog(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  // ==========================================
  // 11. METRICS EXPORT ENDPOINT (/api/metrics)
  // ==========================================
  describe("11. Prometheus Metrics Export (/api/metrics)", () => {
    it("GET /api/metrics - should return 200 with Prometheus text/plain formatted metrics", async () => {
      const req = new NextRequest("http://localhost:3000/api/metrics");
      const res = await getMetrics(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/plain");

      const body = await res.text();
      expect(body).toContain("crm_");
    });
  });

  // ==========================================
  // 12. AUTHENTICATION ENDPOINTS (/api/auth/*)
  // ==========================================
  describe("12. Authentication Endpoints (/api/auth/*)", () => {
    it("POST /api/auth/login - should return 400 when missing credentials", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "" }),
      });
      const res = await authLogin(req);
      expect(res.status).toBe(400);
    });

    it("POST /api/auth/counsellor-login - should return 404 for invalid room code", async () => {
      (prisma.organization.findFirst as jest.Mock).mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost:3000/api/auth/counsellor-login", {
        method: "POST",
        body: JSON.stringify({
          orgCode: "INVALID-ROOM-999",
          email: "priya@crm.com",
          password: "password123",
        }),
      });

      const res = await counsellorLogin(req);
      expect(res.status).toBe(404);
    });

    it("POST /api/auth/register - should return 400 when password and confirmPassword mismatch", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Test Center",
          email: "center@crm.com",
          adminName: "Admin",
          adminEmail: "admin@crm.com",
          password: "password123",
          confirmPassword: "differentPassword456",
        }),
      });

      const res = await authRegister(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("match");
    });

    it("GET /api/auth/me - should return 401 when unauthenticated", async () => {
      (authLib.getSessionUser as jest.Mock).mockResolvedValueOnce(null);

      const res = await authMe();
      expect(res.status).toBe(401);
    });

    it("GET /api/auth/me - should return 200 with user and organization when authenticated", async () => {
      (authLib.getSessionUser as jest.Mock).mockResolvedValueOnce(mockOrgAdminContext.user);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "admin-user-id",
        email: "admin@crm.com",
        name: "Admin User",
        role: "ORG_ADMIN",
        organization: { id: "org-test-1", name: "Test Org", code: "ORG-1001", status: "ACTIVE" },
        _count: { assignedLeads: 0, activities: 0 },
      });

      const res = await authMe();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user.email).toBe("admin@crm.com");
    });

    it("POST /api/auth/logout - should clear session cookie and return 200", async () => {
      const res = await authLogout();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });
});
