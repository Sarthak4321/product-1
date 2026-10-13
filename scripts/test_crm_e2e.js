const http = require("http");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const reqOpts = { timeout: 30000, ...options };
    const req = http.request(reqOpts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: json || data,
        });
      });
    });
    req.on("timeout", () => {
      req.destroy(new Error("Request timed out"));
    });
    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function detectRunningPort() {
  const ports = [3000, 3001, 3002, 8000];
  for (const port of ports) {
    try {
      const res = await request({
        hostname: "127.0.0.1",
        port,
        path: "/api/auth/me",
        method: "GET",
        timeout: 5000,
      });
      if (res.status === 200 || res.status === 401 || res.status === 500) {
        console.log(`📡 Automatically detected active CRM server on port: ${port}\n`);
        return port;
      }
    } catch (e) {
      // Connect ECONNREFUSED etc.
    }
  }
  throw new Error("Could not detect active CRM server running on localhost ports (3000, 3001, 3002, 8000). Is 'npm run dev' running?");
}

async function runE2ETests() {
  console.log("🚀 Starting Coaching Centre CRM Idempotent End-to-End Test Suite...\n");
  
  let port;
  try {
    port = await detectRunningPort();
  } catch (err) {
    console.error(`❌ Server Detection Error: ${err.message}`);
    process.exit(1);
  }

  // Setup E2E Test Users dynamically
  const bcrypt = require("bcryptjs");
  let e2eOrg;
  const uniqueSeed = Date.now().toString().slice(-6);

  try {
    const adminHash = await bcrypt.hash("admin123", 10);
    const counsellorHash = await bcrypt.hash("counsellor123", 10);
    const superAdminHash = await bcrypt.hash("superadmin123", 10);

    // Clean up any stray data from previous runs
    await prisma.whatsAppActivity.deleteMany({ where: { user: { email: { in: ["e2e_admin@crm.com", "e2e_priya@crm.com", "e2e_super@crm.com"] } } } });
    await prisma.leadActivity.deleteMany({ where: { user: { email: { in: ["e2e_admin@crm.com", "e2e_priya@crm.com", "e2e_super@crm.com"] } } } });
    await prisma.lead.deleteMany({ where: { assignedTo: { email: { in: ["e2e_admin@crm.com", "e2e_priya@crm.com", "e2e_super@crm.com"] } } } });
    await prisma.employee.deleteMany({ where: { email: { in: ["e2e_admin@crm.com", "e2e_priya@crm.com", "e2e_emp@crm.com"] } } });
    await prisma.user.deleteMany({ where: { email: { in: ["e2e_admin@crm.com", "e2e_priya@crm.com", "e2e_super@crm.com"] } } });
    await prisma.organization.deleteMany({ where: { slug: { in: ["e2e-test-workspace", "e2e-workspace-2"] } } });

    // Create E2E Test Organization
    e2eOrg = await prisma.organization.create({
      data: {
        name: "E2E Test Workspace",
        slug: "e2e-test-workspace",
        code: `E2E-${uniqueSeed.slice(-4)}`,
        email: "e2e@crm.com",
        status: "ACTIVE",
      },
    });

    // Create E2E Test Users
    await prisma.user.create({
      data: {
        organizationId: e2eOrg.id,
        name: "E2E Admin",
        email: "e2e_admin@crm.com",
        passwordHash: adminHash,
        role: "ORG_ADMIN",
      },
    });

    await prisma.user.create({
      data: {
        organizationId: e2eOrg.id,
        name: "E2E Counsellor",
        email: "e2e_priya@crm.com",
        passwordHash: counsellorHash,
        role: "COUNSELLOR",
      },
    });

    await prisma.user.create({
      data: {
        organizationId: null,
        name: "E2E Super Admin",
        email: "e2e_super@crm.com",
        passwordHash: superAdminHash,
        role: "SUPER_ADMIN",
      },
    });

    console.log("🔒 Dynamically initialized E2E test organization & users in the database.\n");
  } catch (dbErr) {
    console.error(`❌ DB Initialization Error: ${dbErr.message}`);
    process.exit(1);
  }

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  let importedIds = [];
  let targetLeadId = null;
  let counsellorCookie = "";
  let adminCookie = "";
  let superAdminCookie = "";

  try {
    const num1 = `98${uniqueSeed}01`;
    const num2 = `98${uniqueSeed}02`;
    const num3 = `98${uniqueSeed}03`;
    const num4 = `98${uniqueSeed}04`;

    // 1. Counsellor Login
    console.log("1. Testing Counsellor Authentication & Virtual Room Login...");
    const loginRes = await request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { email: "e2e_priya@crm.com", password: "counsellor123" }
    );

    assert(loginRes.status === 200, "Counsellor login returns HTTP 200");
    assert(loginRes.body.user.email === "e2e_priya@crm.com", "User email matches Priya");
    assert(loginRes.body.user.role === "COUNSELLOR", "User role is COUNSELLOR");

    const setCookie = loginRes.headers["set-cookie"];
    assert(setCookie && setCookie.length > 0, "Received counsellor session cookie");
    counsellorCookie = setCookie[0].split(";")[0];

    // 1b. Organization Virtual Room Login
    console.log("\n1b. Testing Organization Virtual Room Scoped Authentication...");
    const invalidRoomRes = await request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/auth/counsellor-login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { orgCode: "INVALID-ROOM-CODE-999", email: "e2e_priya@crm.com", password: "counsellor123" }
    );
    assert(invalidRoomRes.status === 404, "Invalid Room Code returns HTTP 404 Not Found");

    const validRoomRes = await request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/auth/counsellor-login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { orgCode: e2eOrg.code || e2eOrg.slug, email: "e2e_priya@crm.com", password: "counsellor123" }
    );
    assert(validRoomRes.status === 200, "Valid Virtual Room Login returns HTTP 200");
    assert(validRoomRes.body.organization.id === e2eOrg.id, "Authenticated room matches target organization");

    // 2. Session Verification
    console.log("\n2. Testing Session Verification (/api/auth/me)...");
    const meRes = await request({
      hostname: "127.0.0.1",
      port,
      path: "/api/auth/me",
      method: "GET",
      headers: { Cookie: counsellorCookie },
    });
    assert(meRes.status === 200, "Session endpoint returns HTTP 200");
    assert(meRes.body.user.name === "E2E Counsellor", "Session user name is E2E Counsellor");

    // 3. Admin Authentication
    console.log("\n3. Testing Admin Authentication (/api/auth/login)...");
    const adminLoginRes = await request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { email: "e2e_admin@crm.com", password: "admin123" }
    );
    assert(adminLoginRes.status === 200, "Admin login returns HTTP 200");
    adminCookie = adminLoginRes.headers["set-cookie"][0].split(";")[0];

    // 4. CSV Preview API
    console.log("\n4. Testing CSV Preview API (/api/leads/import/preview)...");
    const sampleCsv = `phone,name,course
${num1},Student One,JEE
${num2},Student Two,NEET
${num3},Student Three,Foundation
${num1},Student One Duplicate,JEE
invalid-phone-format,Invalid Candidate,Unknown
${num4},Student Four,JEE`;

    const previewRes = await request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/leads/import/preview",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
      },
      { csvContent: sampleCsv }
    );
    assert(previewRes.status === 200, "CSV preview returns HTTP 200");
    assert(previewRes.body.summary.totalRows === 6, "Total rows is 6");
    assert(previewRes.body.summary.validCount > 0, "Valid new leads count is positive");

    // 5. Confirm CSV Bulk Import
    console.log("\n5. Testing CSV Confirm Bulk Import (/api/leads/import/confirm)...");
    const validRowsToImport = previewRes.body.rows
      .filter((r) => r.isValid && !r.isDuplicate)
      .map((r) => ({
        phone: r.phone,
        name: r.name,
        course: r.course,
      }));

    const confirmRes = await request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/leads/import/confirm",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
      },
      { leads: validRowsToImport }
    );
    assert(confirmRes.status === 200, "Confirm import returns HTTP 200");
    assert(confirmRes.body.importedCount > 0, `Imported count is positive (${confirmRes.body.importedCount})`);

    // 6. Lead Retrieval & Status Counts
    console.log("\n6. Testing Lead Retrieval with Pagination & Filters (/api/leads)...");
    const leadsRes = await request({
      hostname: "127.0.0.1",
      port,
      path: "/api/leads?status=ALL&limit=50",
      method: "GET",
      headers: { Cookie: adminCookie },
    });
    assert(leadsRes.status === 200, "Fetch leads returns HTTP 200");
    assert(Array.isArray(leadsRes.body.leads), "Leads response contains array");
    assert(leadsRes.body.leads.length > 0, "Leads array is non-empty");

    importedIds = leadsRes.body.leads.map((l) => l.id);
    targetLeadId = importedIds[0];

    // 7. Single Lead Detail Inspection
    console.log("\n7. Testing Single Lead Detail Inspection (/api/leads/:id)...");
    const leadDetailRes = await request({
      hostname: "127.0.0.1",
      port,
      path: `/api/leads/${targetLeadId}`,
      method: "GET",
      headers: { Cookie: adminCookie },
    });
    assert(leadDetailRes.status === 200, "Single lead detail returns HTTP 200");
    assert(leadDetailRes.body.lead.id === targetLeadId, "Fetched lead ID matches target");

    // 8. Lead Update & Follow-Up Scheduling
    console.log("\n8. Testing Lead Status & Follow-Up Scheduling (PATCH /api/leads/:id)...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const updateLeadRes = await request(
      {
        hostname: "127.0.0.1",
        port,
        path: `/api/leads/${targetLeadId}`,
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: counsellorCookie,
        },
      },
      {
        callResponse: "Follow-up",
        notes: "Requested callback tomorrow afternoon",
        followUpAt: tomorrow.toISOString(),
      }
    );
    assert(updateLeadRes.status === 200, "Update lead call response returns HTTP 200");
    assert(updateLeadRes.body.lead.status === "FOLLOW_UP", "Lead status updated to FOLLOW_UP");

    // 9. WhatsApp Activity Logging
    console.log("\n9. Testing WhatsApp Activity Logging (POST /api/leads/:id/whatsapp)...");
    const waLogRes = await request(
      {
        hostname: "127.0.0.1",
        port,
        path: `/api/leads/${targetLeadId}/whatsapp`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: counsellorCookie,
        },
      },
      { message: "Sent brochure & fee details" }
    );
    assert(waLogRes.status === 200, "WhatsApp activity logging returns HTTP 200");
    assert(waLogRes.body.success === true, "WhatsApp logging success flag is true");

    // 10. Next Lead Queue Progression
    console.log("\n10. Testing Next Lead Queue Progression (/api/leads/next)...");
    const nextLeadRes = await request({
      hostname: "127.0.0.1",
      port,
      path: "/api/leads/next",
      method: "GET",
      headers: { Cookie: counsellorCookie },
    });
    assert(nextLeadRes.status === 200, "Next lead queue endpoint returns HTTP 200");
    assert(nextLeadRes.body !== undefined, "Next lead payload returned");

    // 11. Counsellors API & Assignment
    console.log("\n11. Testing Counsellors Management & Assignment (/api/counsellors)...");
    const counsellorsListRes = await request({
      hostname: "127.0.0.1",
      port,
      path: "/api/counsellors",
      method: "GET",
      headers: { Cookie: adminCookie },
    });
    assert(counsellorsListRes.status === 200, "GET /api/counsellors returns HTTP 200");
    const priyaCounsellor = counsellorsListRes.body.counsellors.find((c) => c.email === "e2e_priya@crm.com");
    assert(!!priyaCounsellor, "E2E Counsellor found in list");

    const assignRes = await request(
      {
        hostname: "127.0.0.1",
        port,
        path: `/api/counsellors/${priyaCounsellor.id}/leads`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
      },
      { leadIds: [targetLeadId] }
    );
    assert(assignRes.status === 200, "POST assign leads to counsellor returns HTTP 200");

    // 12. Counsellor Activities Timeline
    console.log("\n12. Testing Counsellor Activity Timeline (/api/counsellors/:id/activities)...");
    const activitiesRes = await request({
      hostname: "127.0.0.1",
      port,
      path: `/api/counsellors/${priyaCounsellor.id}/activities`,
      method: "GET",
      headers: { Cookie: adminCookie },
    });
    assert(activitiesRes.status === 200, "Counsellor activities stream returns HTTP 200");
    assert(Array.isArray(activitiesRes.body.activities), "Activities is an array");

    // 13. Admin Analytics Endpoint
    console.log("\n13. Testing Admin Analytics Dashboard API (/api/admin/analytics)...");
    const analyticsRes = await request({
      hostname: "127.0.0.1",
      port,
      path: "/api/admin/analytics",
      method: "GET",
      headers: { Cookie: adminCookie },
    });
    assert(analyticsRes.status === 200, "GET /api/admin/analytics returns HTTP 200");
    assert(typeof analyticsRes.body.summary === "object", "Analytics response contains summary object");

    // 14. Admin System Error Logs & Diagnostic Trigger
    console.log("\n14. Testing System Audit Logs & Diagnostics (/api/admin/logs)...");
    const testLogRes = await request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/admin/logs",
        method: "POST",
        headers: { Cookie: adminCookie },
      },
      {}
    );
    // Standard org admin returns 403 or 200 based on role check
    assert(testLogRes.status === 200 || testLogRes.status === 403, "POST /api/admin/logs handled with appropriate auth code");

    // 15. HR & Employee Operations
    console.log("\n15. Testing HR Employee & Structure Operations (/api/hr/*)...");
    const createEmpRes = await request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/hr/employees",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
      },
      {
        firstName: "Anjali",
        lastName: "Menon",
        email: `e2e_emp_${uniqueSeed}@crm.com`,
        phone: "9876543210",
      }
    );
    assert(createEmpRes.status === 201 || createEmpRes.status === 200, "POST create employee returns 200/201");
    const createdEmpId = createEmpRes.body.employee?.id;

    if (createdEmpId) {
      const getEmpRes = await request({
        hostname: "127.0.0.1",
        port,
        path: `/api/hr/employees/${createdEmpId}`,
        method: "GET",
        headers: { Cookie: adminCookie },
      });
      assert(getEmpRes.status === 200, "GET single employee returns HTTP 200");

      const patchEmpRes = await request(
        {
          hostname: "127.0.0.1",
          port,
          path: `/api/hr/employees/${createdEmpId}`,
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: adminCookie,
          },
        },
        { status: "ACTIVE" }
      );
      assert(patchEmpRes.status === 200, "PATCH employee returns HTTP 200");

      const deleteEmpRes = await request({
        hostname: "127.0.0.1",
        port,
        path: `/api/hr/employees/${createdEmpId}`,
        method: "DELETE",
        headers: { Cookie: adminCookie },
      });
      assert(deleteEmpRes.status === 200, "DELETE (deactivate) employee returns HTTP 200");
    }

    // 16. Multi-Tenant Workspace Registration & Cross-Tenant Security Isolation
    console.log("\n16. Testing Multi-Tenant Workspace Registration & Strict Isolation...");
    const org2RegRes = await request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/auth/register",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        name: "E2E Second Workspace",
        slug: `e2e-workspace-2-${uniqueSeed}`,
        email: `org2_${uniqueSeed}@crm.com`,
        phone: "9123456780",
        city: "Mumbai",
        state: "Maharashtra",
        zipCode: "400001",
        adminName: "Org 2 Administrator",
        adminEmail: `e2e_org2_${uniqueSeed}@crm.com`,
        password: "password123",
        confirmPassword: "password123",
      }
    );
    assert(org2RegRes.status === 200, "Workspace registration (/api/auth/register) returns HTTP 200");
    const org2CookieHeader = org2RegRes.headers["set-cookie"][0].split(";")[0];

    // Assert Org 2 cannot see Org 1 leads
    const org2LeadsRes = await request({
      hostname: "127.0.0.1",
      port,
      path: "/api/leads?status=ALL",
      method: "GET",
      headers: { Cookie: org2CookieHeader },
    });
    assert(org2LeadsRes.status === 200, "Org 2 fetch leads returns HTTP 200");
    assert(org2LeadsRes.body.leads.length === 0, "Org 2 initial leads list is 0 (Org 1 leads strictly isolated)");

    // Assert Org 2 cannot read Org 1 lead by ID (HTTP 404)
    if (targetLeadId) {
      const crossOrgGetRes = await request({
        hostname: "127.0.0.1",
        port,
        path: `/api/leads/${targetLeadId}`,
        method: "GET",
        headers: { Cookie: org2CookieHeader },
      });
      assert(crossOrgGetRes.status === 404, "Org 2 GET Org 1 lead ID returns HTTP 404 Not Found");
    }

    // 17. Organization Settings API
    console.log("\n17. Testing Organization Settings API (/api/organization/settings)...");
    const orgSettingsGetRes = await request({
      hostname: "127.0.0.1",
      port,
      path: "/api/organization/settings",
      method: "GET",
      headers: { Cookie: org2CookieHeader },
    });
    assert(orgSettingsGetRes.status === 200, "GET /api/organization/settings returns HTTP 200");

    const orgSettingsPatchRes = await request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/organization/settings",
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: org2CookieHeader },
      },
      { name: "Updated E2E Workspace Name", city: "Pune" }
    );
    assert(orgSettingsPatchRes.status === 200, "PATCH /api/organization/settings returns HTTP 200");

    // 18. Prometheus Metrics Telemetry Export
    console.log("\n18. Testing Prometheus Metrics Telemetry (/api/metrics)...");
    const metricsRes = await request({
      hostname: "127.0.0.1",
      port,
      path: "/api/metrics",
      method: "GET",
    });
    assert(metricsRes.status === 200, "GET /api/metrics returns HTTP 200");
    assert(metricsRes.body.includes("crm_"), "Metrics payload contains crm_ telemetry metrics");

    // 19. User Logout
    console.log("\n19. Testing User Logout (/api/auth/logout)...");
    const logoutRes = await request({
      hostname: "127.0.0.1",
      port,
      path: "/api/auth/logout",
      method: "POST",
      headers: { Cookie: org2CookieHeader },
    });
    assert(logoutRes.status === 200, "POST /api/auth/logout returns HTTP 200");

    console.log(`\n🎉 ALL ${passed}/${total} LIVE E2E ENDPOINTS & WORKFLOWS TESTED SUCCESSFULLY! 🎉\n`);
  } finally {
    console.log("🧹 Cleaning up dynamic E2E test data...");
    try {
      await prisma.whatsAppActivity.deleteMany({ where: { user: { email: { in: ["e2e_admin@crm.com", "e2e_priya@crm.com", "e2e_super@crm.com"] } } } });
      await prisma.leadActivity.deleteMany({ where: { user: { email: { in: ["e2e_admin@crm.com", "e2e_priya@crm.com", "e2e_super@crm.com"] } } } });
      await prisma.lead.deleteMany({ where: { assignedTo: { email: { in: ["e2e_admin@crm.com", "e2e_priya@crm.com", "e2e_super@crm.com"] } } } });
      await prisma.employee.deleteMany({ where: { email: { in: ["e2e_admin@crm.com", "e2e_priya@crm.com", "e2e_emp@crm.com"] } } });
      await prisma.user.deleteMany({ where: { email: { in: ["e2e_admin@crm.com", "e2e_priya@crm.com", "e2e_super@crm.com"] } } });
      await prisma.organization.deleteMany({ where: { slug: { in: ["e2e-test-workspace", "e2e-workspace-2"] } } });
    } catch (cleanupErr) {
      console.error("Warning: Cleanup error:", cleanupErr.message);
    }
    await prisma.$disconnect();
  }
}

runE2ETests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
