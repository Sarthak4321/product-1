const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Dropping old Lead phone unique constraint...");
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_phone_key1" CASCADE;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_phone_key" CASCADE;`);
    console.log("Successfully dropped old phone unique constraints.");
  } catch (err) {
    console.error("Error dropping constraint:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
