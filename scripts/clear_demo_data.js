const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function clearDemoData() {
  console.log("🧹 Clearing all demo/test leads, activity logs, and system error logs...");

  try {
    const deletedActivities = await prisma.leadActivity.deleteMany({});
    console.log(`Deleted ${deletedActivities.count} LeadActivity records.`);

    const deletedWhatsApp = await prisma.whatsAppActivity.deleteMany({});
    console.log(`Deleted ${deletedWhatsApp.count} WhatsAppActivity records.`);

    const deletedErrorLogs = await prisma.systemErrorLog.deleteMany({});
    console.log(`Deleted ${deletedErrorLogs.count} SystemErrorLog records.`);

    const deletedLeads = await prisma.lead.deleteMany({});
    console.log(`Deleted ${deletedLeads.count} Lead records.`);

    console.log("✅ Database successfully wiped clean! Only Admin and Counsellor accounts remain.");
  } catch (error) {
    console.error("❌ Error clearing data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDemoData();
