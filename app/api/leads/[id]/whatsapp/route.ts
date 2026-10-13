import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationContext } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getOrganizationContext(req);

    const body = await req.json();
    const { message } = body;

    const lead = await prisma.lead.findFirst({
      where: {
        id: params.id,
        organizationId: context.organizationId,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const [activity] = await prisma.$transaction([
      prisma.whatsAppActivity.create({
        data: {
          organizationId: context.organizationId,
          leadId: params.id,
          userId: context.userId,
          message: message || "WhatsApp link opened from CRM",
          status: "WHATSAPP_OPENED",
        },
      }),
      prisma.lead.update({
        where: { id: params.id },
        data: {}, // Triggers @updatedAt in prisma
      }),
    ]);

    return NextResponse.json({ success: true, activity });
  } catch (error: any) {
    console.error("Record WhatsApp action error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to record WhatsApp activity" },
      { status: statusCode }
    );
  }
}
