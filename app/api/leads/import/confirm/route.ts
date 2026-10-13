import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationContext } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const context = await getOrganizationContext(req, ["ORG_ADMIN", "ADMIN", "SUPER_ADMIN"]);

    const body = await req.json();
    const { phones, leads, assignedToId } = body;

    // Verify counsellor belongs to authenticated organization if assignedToId provided
    let validAssigneeId: string | null = null;
    if (assignedToId) {
      const counsellor = await prisma.user.findFirst({
        where: {
          id: assignedToId,
          organizationId: context.organizationId,
        },
      });
      if (counsellor) {
        validAssigneeId = counsellor.id;
      }
    }

    let leadsToCreate: Array<{
      organizationId: string | null;
      phone: string;
      name?: string | null;
      course?: string | null;
      place?: string | null;
      class?: string | null;
      notes?: string | null;
      status: string;
      assignedToId: string | null;
    }> = [];

    if (Array.isArray(leads) && leads.length > 0) {
      leadsToCreate = leads.map((leadItem: any) => ({
        organizationId: context.organizationId,
        phone: String(leadItem.phone).trim(),
        name: leadItem.name ? String(leadItem.name).trim() : null,
        course: leadItem.course ? String(leadItem.course).trim() : null,
        place: leadItem.place ? String(leadItem.place).trim() : null,
        class: leadItem.class ? String(leadItem.class).trim() : null,
        notes: leadItem.notes ? String(leadItem.notes).trim() : null,
        status: "NEW",
        assignedToId: validAssigneeId,
      }));
    } else if (Array.isArray(phones) && phones.length > 0) {
      leadsToCreate = phones.map((phone: string) => ({
        organizationId: context.organizationId,
        phone: String(phone).trim(),
        status: "NEW",
        assignedToId: validAssigneeId,
      }));
    } else {
      return NextResponse.json(
        { error: "No valid lead records or phone numbers provided for import" },
        { status: 400 }
      );
    }

    const result = await prisma.lead.createMany({
      data: leadsToCreate,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      importedCount: result.count,
    });
  } catch (error: any) {
    console.error("Confirm import error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to import leads" },
      { status: statusCode }
    );
  }
}
