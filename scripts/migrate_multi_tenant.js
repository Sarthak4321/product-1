const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runMigration() {
  console.log("🔄 Starting Multi-Tenant Database Migration & Data Backfill...");

  try {
    // 1. Ensure Default Organization exists
    let defaultOrg = await prisma.organization.findUnique({
      where: { slug: "default-workspace" },
    });

    if (!defaultOrg) {
      defaultOrg = await prisma.organization.create({
        data: {
          name: "Current LeadDesk Workspace",
          slug: "default-workspace",
          email: "support@leaddesk.com",
          phone: "9876543210",
          city: "New Delhi",
          state: "Delhi",
          zipCode: "110001",
          status: "ACTIVE",
        },
      });
      console.log(`✅ Created Default Organization: ${defaultOrg.name} (${defaultOrg.id})`);
    } else {
      console.log(`ℹ️ Default Organization exists: ${defaultOrg.name} (${defaultOrg.id})`);
    }

    const orgId = defaultOrg.id;

    // 2. Backfill Users
    const usersUpdated = await prisma.user.updateMany({
      where: { organizationId: null },
      data: { organizationId: orgId },
    });
    console.log(`✅ Backfilled organizationId on ${usersUpdated.count} Users.`);

    // 3. Backfill Leads
    const leadsUpdated = await prisma.lead.updateMany({
      where: { organizationId: null },
      data: { organizationId: orgId },
    });
    console.log(`✅ Backfilled organizationId on ${leadsUpdated.count} Leads.`);

    // 4. Backfill LeadActivities
    const leadActivitiesUpdated = await prisma.leadActivity.updateMany({
      where: { organizationId: null },
      data: { organizationId: orgId },
    });
    console.log(`✅ Backfilled organizationId on ${leadActivitiesUpdated.count} LeadActivities.`);

    // 5. Backfill WhatsAppActivities
    const whatsAppActivitiesUpdated = await prisma.whatsAppActivity.updateMany({
      where: { organizationId: null },
      data: { organizationId: orgId },
    });
    console.log(`✅ Backfilled organizationId on ${whatsAppActivitiesUpdated.count} WhatsAppActivities.`);

    // 6. Backfill SystemErrorLogs
    const systemLogsUpdated = await prisma.systemErrorLog.updateMany({
      where: { organizationId: null },
      data: { organizationId: orgId },
    });
    console.log(`✅ Backfilled organizationId on ${systemLogsUpdated.count} SystemErrorLogs.`);

    // 7. Verify zero orphaned records on tenant-owned entities
    const unassignedUsers = await prisma.user.count({ where: { organizationId: null } });
    const unassignedLeads = await prisma.lead.count({ where: { organizationId: null } });
    const unassignedActivities = await prisma.leadActivity.count({ where: { organizationId: null } });
    const unassignedWhatsApp = await prisma.whatsAppActivity.count({ where: { organizationId: null } });

    console.log("\n📊 Migration Verification Summary:");
    console.log(`- Unassigned Users: ${unassignedUsers}`);
    console.log(`- Unassigned Leads: ${unassignedLeads}`);
    console.log(`- Unassigned Lead Activities: ${unassignedActivities}`);
    console.log(`- Unassigned WhatsApp Activities: ${unassignedWhatsApp}`);

    if (unassignedUsers === 0 && unassignedLeads === 0 && unassignedActivities === 0 && unassignedWhatsApp === 0) {
      console.log("\n🎉 MULTI-TENANT MIGRATION & BACKFILL COMPLETED SUCCESSFULLY!");
    } else {
      console.error("\n⚠️ WARNING: Some records were not assigned to an organization.");
    }
  } catch (err) {
    console.error("❌ Migration error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
