import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationContext } from "@/lib/auth";
import { parseAndNormalizePhone } from "@/lib/phone";

export async function GET(req: NextRequest) {
  try {
    const context = await getOrganizationContext(req);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim().toUpperCase() || "ALL";
    const assigned = searchParams.get("assigned")?.trim() || "";

    const skip = (page - 1) * limit;

    // Base filters
    const where: any = {
      organizationId: context.organizationId,
    };
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Status filter
    if (status && status !== "ALL") {
      if (status === "TODAY_FOLLOW_UP") {
        where.status = "FOLLOW_UP";
        where.followUpAt = { lte: endOfToday };
      } else {
        where.status = status;
      }
    }

    // Role-based lead scoping:
    if (context.role === "COUNSELLOR") {
      if (assigned === "me") {
        where.assignedToId = context.userId;
      }
    } else if (assigned && assigned !== "all") {
      where.assignedToId = assigned === "unassigned" ? null : assigned;
    }

    // Search filter (phone, name, place, course)
    if (search) {
      const cleanDigits = search.replace(/\D/g, "");
      where.OR = [
        { name: { contains: search } },
        { place: { contains: search } },
        { course: { contains: search } },
        ...(cleanDigits.length >= 3 ? [{ phone: { contains: cleanDigits } }] : [{ phone: { contains: search } }]),
      ];
    }

    // Parallel fetch for counts and paginated leads
    const [leads, total, statusCounts, dueFollowUpsCount] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          ...(status === "FOLLOW_UP" || status === "TODAY_FOLLOW_UP" ? [{ followUpAt: "asc" as const }] : []),
          { createdAt: "desc" },
        ],
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { activities: true },
          },
        },
      }),
      prisma.lead.count({ where }),
      prisma.lead.groupBy({
        by: ["status"],
        _count: { _all: true },
        where: {
          organizationId: context.organizationId,
          ...(context.role === "COUNSELLOR" && assigned === "me" ? { assignedToId: context.userId } : {}),
        },
      }),
      prisma.lead.count({
        where: {
          organizationId: context.organizationId,
          status: "FOLLOW_UP",
          followUpAt: { lte: endOfToday },
          ...(context.role === "COUNSELLOR" ? { assignedToId: context.userId } : {}),
        },
      }),
    ]);

    // Build counts dictionary
    const countsMap: Record<string, number> = {
      ALL: 0,
      TODAY_FOLLOW_UP: dueFollowUpsCount,
      NEW: 0,
      CONTACTED: 0,
      INTERESTED: 0,
      FOLLOW_UP: 0,
      NOT_INTERESTED: 0,
      NO_ANSWER: 0,
      WRONG_NUMBER: 0,
      CONVERTED: 0,
    };

    let allTotal = 0;
    statusCounts.forEach((sc: { status: string; _count: { _all: number } }) => {
      countsMap[sc.status] = sc._count._all;
      allTotal += sc._count._all;
    });
    countsMap.ALL = allTotal;

    return NextResponse.json({
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        countsMap,
        dueFollowUpsCount,
      },
    });
  } catch (error: any) {
    console.error("Fetch leads error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch leads" },
      { status: statusCode }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getOrganizationContext(req);

    const body = await req.json();
    const { phone, name, class: leadClass, place, course, notes, assignedToId } = body;

    const parsedPhone = parseAndNormalizePhone(phone);
    if (!parsedPhone.isValid) {
      return NextResponse.json(
        { error: parsedPhone.error || "Invalid phone number" },
        { status: 400 }
      );
    }

    // Check if phone already exists in this organization
    const existing = await prisma.lead.findUnique({
      where: {
        organizationId_phone: {
          organizationId: context.organizationId,
          phone: parsedPhone.normalized,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This phone number already exists in your workspace." },
        { status: 409 }
      );
    }

    // Verify target assigned counsellor belongs to the same organization if specified
    let targetAssigneeId = assignedToId || (context.role === "COUNSELLOR" ? context.userId : null);
    if (targetAssigneeId && targetAssigneeId !== context.userId) {
      const targetUser = await prisma.user.findFirst({
        where: { id: targetAssigneeId, organizationId: context.organizationId },
      });
      if (!targetUser) {
        targetAssigneeId = null;
      }
    }

    const newLead = await prisma.lead.create({
      data: {
        organizationId: context.organizationId,
        phone: parsedPhone.normalized,
        name: name?.trim() || null,
        class: leadClass?.trim() || null,
        place: place?.trim() || null,
        course: course?.trim() || null,
        notes: notes?.trim() || null,
        status: "NEW",
        assignedToId: targetAssigneeId,
      },
    });

    return NextResponse.json({ success: true, lead: newLead });
  } catch (error: any) {
    console.error("Create lead error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to create lead" },
      { status: statusCode }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const context = await getOrganizationContext(req, ["ORG_ADMIN", "ADMIN", "SUPER_ADMIN"]);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      await prisma.lead.deleteMany({
        where: { id, organizationId: context.organizationId },
      });
      return NextResponse.json({ success: true, message: "Lead deleted successfully" });
    }

    const body = await req.json();
    const { leadIds } = body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: "No lead IDs provided for deletion" },
        { status: 400 }
      );
    }

    const deleteRes = await prisma.lead.deleteMany({
      where: {
        id: { in: leadIds },
        organizationId: context.organizationId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteRes.count} leads.`,
    });
  } catch (error: any) {
    console.error("Delete leads error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to delete leads" },
      { status: statusCode }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const context = await getOrganizationContext(req, ["ORG_ADMIN", "ADMIN", "SUPER_ADMIN"]);

    const body = await req.json();
    const { leadIds, status, assignedToId } = body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: "No lead IDs provided" },
        { status: 400 }
      );
    }

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (assignedToId !== undefined) {
      if (assignedToId === "unassigned") {
        dataToUpdate.assignedToId = null;
      } else {
        // Verify counsellor belongs to same org
        const targetUser = await prisma.user.findFirst({
          where: { id: assignedToId, organizationId: context.organizationId },
        });
        if (!targetUser) {
          return NextResponse.json(
            { error: "Assigned counsellor must belong to your organization." },
            { status: 400 }
          );
        }
        dataToUpdate.assignedToId = assignedToId;
      }
    }

    const updateRes = await prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
        organizationId: context.organizationId,
      },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updateRes.count} leads.`,
    });
  } catch (error: any) {
    console.error("Bulk update leads error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to update leads" },
      { status: statusCode }
    );
  }
}
