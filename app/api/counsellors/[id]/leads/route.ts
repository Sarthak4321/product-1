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

    const leads = await prisma.lead.findMany({
      where: {
        assignedToId: counsellorId,
        organizationId: context.organizationId,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, leads });
  } catch (error: any) {
    console.error("Fetch counsellor leads error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch leads for this counsellor" },
      { status: statusCode }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getOrganizationContext(req, ["ORG_ADMIN", "ADMIN", "SUPER_ADMIN"]);

    const body = await req.json();
    const { leadIds, action } = body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: "No lead IDs provided" },
        { status: 400 }
      );
    }

    const counsellorId = params.id;

    // Verify counsellor belongs to authenticated organization
    const counsellor = await prisma.user.findFirst({
      where: { id: counsellorId, organizationId: context.organizationId },
    });
    if (!counsellor) {
      return NextResponse.json({ error: "Counsellor not found" }, { status: 404 });
    }

    if (action === "DELETE") {
      await prisma.lead.deleteMany({
        where: {
          id: { in: leadIds },
          assignedToId: counsellorId,
          organizationId: context.organizationId,
        },
      });
    } else {
      await prisma.lead.updateMany({
        where: {
          id: { in: leadIds },
          assignedToId: counsellorId,
          organizationId: context.organizationId,
        },
        data: {
          assignedToId: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully executed ${action} action on leads.`,
    });
  } catch (error: any) {
    console.error("Delete/unassign counsellor leads error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to process lead operations" },
      { status: statusCode }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getOrganizationContext(req, ["ORG_ADMIN", "ADMIN", "SUPER_ADMIN"]);

    const body = await req.json();
    const { leadIds } = body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: "No lead IDs provided" },
        { status: 400 }
      );
    }

    const counsellorId = params.id;

    // Verify target counsellor belongs to the authenticated organization
    const counsellor = await prisma.user.findFirst({
      where: {
        id: counsellorId,
        organizationId: context.organizationId,
        role: "COUNSELLOR",
      },
    });

    if (!counsellor) {
      return NextResponse.json(
        { error: "Counsellor not found in your organization" },
        { status: 404 }
      );
    }

    // Only assign leads that belong to the authenticated organization
    const updateRes = await prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
        organizationId: context.organizationId,
      },
      data: { assignedToId: counsellorId },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${updateRes.count} leads to ${counsellor.name}`,
    });
  } catch (error: any) {
    console.error("Assign leads to counsellor error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to assign leads" },
      { status: statusCode }
    );
  }
}
