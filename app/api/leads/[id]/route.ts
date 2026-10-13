import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationContext } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getOrganizationContext(req);

    const lead = await prisma.lead.findFirst({
      where: {
        id: params.id,
        organizationId: context.organizationId,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        activities: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        whatsAppActivities: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error: any) {
    console.error("Get lead details error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch lead details" },
      { status: statusCode }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getOrganizationContext(req);

    const body = await req.json();
    const {
      name,
      class: leadClass,
      place,
      course,
      status,
      callResponse,
      notes,
      followUpAt,
      assignedToId,
    } = body;

    // Check existing lead scoped to organization
    const existingLead = await prisma.lead.findFirst({
      where: {
        id: params.id,
        organizationId: context.organizationId,
      },
    });

    if (!existingLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Determine updated status
    let updatedStatus = status || existingLead.status;
    if (callResponse) {
      switch (callResponse) {
        case "Interested":
          updatedStatus = "INTERESTED";
          break;
        case "Follow-up":
          updatedStatus = "FOLLOW_UP";
          break;
        case "Not Interested":
          updatedStatus = "NOT_INTERESTED";
          break;
        case "No Answer":
          updatedStatus = "NO_ANSWER";
          break;
        case "Wrong Number":
          updatedStatus = "WRONG_NUMBER";
          break;
        case "Converted":
          updatedStatus = "CONVERTED";
          break;
        case "Contacted":
          updatedStatus = "CONTACTED";
          break;
      }
    }

    // Parse follow-up date
    let parsedFollowUpDate: Date | null = null;
    if (updatedStatus === "FOLLOW_UP" && followUpAt) {
      parsedFollowUpDate = new Date(followUpAt);
    }

    // Execute in transaction: update lead + create activity log
    const [updatedLead] = await prisma.$transaction([
      prisma.lead.update({
        where: { id: params.id },
        data: {
          name: name !== undefined ? (name ? name.trim() : null) : existingLead.name,
          class: leadClass !== undefined ? (leadClass ? leadClass.trim() : null) : existingLead.class,
          place: place !== undefined ? (place ? place.trim() : null) : existingLead.place,
          course: course !== undefined ? (course ? course.trim() : null) : existingLead.course,
          status: updatedStatus,
          followUpAt: parsedFollowUpDate || (updatedStatus !== "FOLLOW_UP" ? null : existingLead.followUpAt),
          notes: notes !== undefined ? (notes ? notes.trim() : null) : existingLead.notes,
          assignedToId:
            assignedToId !== undefined
              ? assignedToId
              : existingLead.assignedToId || (context.role === "COUNSELLOR" ? context.userId : null),
        },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      }),
      ...(callResponse || notes
        ? [
            prisma.leadActivity.create({
              data: {
                organizationId: context.organizationId,
                leadId: params.id,
                userId: context.userId,
                type: "CALL",
                response: callResponse || null,
                notes: notes ? notes.trim() : null,
              },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (error: any) {
    console.error("Update lead error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to update lead. Please try again." },
      { status: statusCode }
    );
  }
}
