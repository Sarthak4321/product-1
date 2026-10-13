import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationContext } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getOrganizationContext(req, ["ORG_ADMIN", "ADMIN", "SUPER_ADMIN"]);
    const counsellorId = params.id;

    // Verify counsellor belongs to authenticated organization
    const counsellor = await prisma.user.findFirst({
      where: { id: counsellorId, organizationId: context.organizationId },
    });
    if (!counsellor) {
      return NextResponse.json({ error: "Counsellor not found" }, { status: 404 });
    }

    const activities = await prisma.leadActivity.findMany({
      where: {
        userId: counsellorId,
        organizationId: context.organizationId,
        notes: {
          not: "",
        },
      },
      include: {
        lead: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const formatted = activities.map((a: any) => ({
      id: a.id,
      type: "CALL_NOTE",
      activityType: a.type,
      notes: a.notes,
      response: a.response,
      createdAt: a.createdAt,
      lead: a.lead,
    }));

    return NextResponse.json({ success: true, activities: formatted });
  } catch (error: any) {
    console.error("Fetch counsellor activities error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch call notes" },
      { status: statusCode }
    );
  }
}
