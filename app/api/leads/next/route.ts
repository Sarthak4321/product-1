import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationContext } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const context = await getOrganizationContext(req);

    const { searchParams } = new URL(req.url);
    const excludeId = searchParams.get("excludeId");

    const baseWhere: any = {
      organizationId: context.organizationId,
    };
    if (excludeId) {
      baseWhere.id = { not: excludeId };
    }

    // 1. Check for due follow-ups assigned to this counsellor
    const dueFollowUp = await prisma.lead.findFirst({
      where: {
        ...baseWhere,
        status: "FOLLOW_UP",
        assignedToId: context.userId,
        followUpAt: { lte: new Date() },
      },
      orderBy: { followUpAt: "asc" },
      select: { id: true, phone: true, name: true, status: true },
    });

    if (dueFollowUp) {
      return NextResponse.json({ lead: dueFollowUp, reason: "DUE_FOLLOW_UP" });
    }

    // 2. Next NEW lead assigned to this counsellor
    const nextAssignedNew = await prisma.lead.findFirst({
      where: {
        ...baseWhere,
        status: "NEW",
        assignedToId: context.userId,
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, phone: true, name: true, status: true },
    });

    if (nextAssignedNew) {
      return NextResponse.json({ lead: nextAssignedNew, reason: "ASSIGNED_NEW" });
    }

    // 3. Next unassigned NEW lead in organization
    const nextUnassignedNew = await prisma.lead.findFirst({
      where: {
        ...baseWhere,
        status: "NEW",
        assignedToId: null,
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, phone: true, name: true, status: true },
    });

    if (nextUnassignedNew) {
      return NextResponse.json({ lead: nextUnassignedNew, reason: "UNASSIGNED_NEW" });
    }

    // 4. Any remaining unprocessed/follow-up lead in organization
    const anyPending = await prisma.lead.findFirst({
      where: {
        ...baseWhere,
        status: { in: ["NEW", "NO_ANSWER", "FOLLOW_UP"] },
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, phone: true, name: true, status: true },
    });

    return NextResponse.json({ lead: anyPending || null });
  } catch (error: any) {
    console.error("Next lead error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to determine next lead" },
      { status: statusCode }
    );
  }
}
