import { prisma } from "./prisma";

export function generateOrgCode(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const prefix = cleanName.length >= 3 ? cleanName.substring(0, 3) : "ORG";
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
}

export async function findOrganizationByRoomId(roomId: string) {
  if (!roomId || !roomId.trim()) return null;
  const cleanId = roomId.trim();

  // Try exact code, uppercase code, slug, or id
  const org = await prisma.organization.findFirst({
    where: {
      OR: [
        { code: cleanId.toUpperCase() },
        { code: cleanId },
        { slug: cleanId.toLowerCase() },
        { id: cleanId },
      ],
    },
  });

  return org;
}

export async function ensureOrgCode(orgId: string, name: string): Promise<string> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, code: true, name: true },
  });

  if (!org) throw new Error("Organization not found");
  if (org.code) return org.code;

  // Generate unique code if not exists
  let code = generateOrgCode(org.name || name);
  let existing = await prisma.organization.findUnique({ where: { code } });
  while (existing) {
    code = generateOrgCode(org.name || name);
    existing = await prisma.organization.findUnique({ where: { code } });
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: { code },
  });

  return code;
}
