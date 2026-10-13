import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureOrgCode } from "@/lib/org-code";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user: any = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        organization: true,
        _count: {
          select: {
            assignedLeads: true,
            activities: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    if (user.organization && !user.organization.code) {
      const code = await ensureOrgCode(user.organization.id, user.organization.name);
      user.organization.code = code;
    }

    // Strip passwordHash before returning
    const { passwordHash, ...safeUser } = user;

    return NextResponse.json({ user: safeUser });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
