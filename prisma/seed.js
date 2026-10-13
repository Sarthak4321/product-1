const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.whatsAppActivity.deleteMany({});
  await prisma.leadActivity.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});

  // 1. Create Default Organization
  const org = await prisma.organization.create({
    data: {
      name: "Current LeadDesk Workspace",
      slug: "default-workspace",
      code: "ORG-1001",
      email: "contact@leaddesk.com",
      phone: "9876543210",
      city: "New Delhi",
      state: "Delhi",
      zipCode: "110001",
      status: "ACTIVE",
    },
  });
  console.log("Created Default Organization:", org.name, `(${org.id})`);

  const superAdminHash = await bcrypt.hash("superadmin123", 10);
  const adminHash = await bcrypt.hash("admin123", 10);
  const counsellorHash = await bcrypt.hash("counsellor123", 10);

  // 1b. Create Platform Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      organizationId: null,
      name: "Platform Super Admin",
      email: "superadmin@crm.com",
      passwordHash: superAdminHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log("Created Platform Super Admin:", superAdmin.email);

  // 2. Create Institute Admin
  const admin = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: "Institute Admin",
      email: "admin@crm.com",
      passwordHash: adminHash,
      role: "ORG_ADMIN",
    },
  });
  console.log("Created Institute Admin:", admin.email);

  // 3. Create Counsellors
  const priya = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: "Priya Sharma",
      email: "priya@crm.com",
      passwordHash: counsellorHash,
      role: "COUNSELLOR",
    },
  });

  const amit = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: "Amit Kumar",
      email: "amit@crm.com",
      passwordHash: counsellorHash,
      role: "COUNSELLOR",
    },
  });
  console.log("Created Counsellors:", priya.email, amit.email);

  console.log("✅ Initial Organization, Admin & Counsellors seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

