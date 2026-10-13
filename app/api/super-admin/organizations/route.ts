import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Authenticate user strictly as SUPER_ADMIN
    const user = await requireAuthUser(["SUPER_ADMIN"]);

    // Fetch all organizations with details and counts
    const organizations = await prisma.organization.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            users: true,
            leads: true,
            leadActivities: true,
            whatsAppActivities: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute platform-wide totals
    const [
      totalPlatformLeads,
      totalPlatformUsers,
      totalSystemErrors,
      totalContactQueries,
      pendingContactQueries,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.user.count(),
      prisma.systemErrorLog.count(),
      (prisma as any).contactQuery.count(),
      (prisma as any).contactQuery.count({ where: { status: "PENDING" } }),
    ]);

    // Format organization records with admin details
    const formattedOrgs = organizations.map((org) => {
      const orgAdmin = org.users.find(
        (u) => u.role === "ORG_ADMIN" || u.role === "ADMIN" || u.role === "SUPER_ADMIN"
      ) || org.users[0];

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        email: org.email || orgAdmin?.email || "N/A",
        phone: org.phone || "N/A",
        city: org.city || "N/A",
        state: org.state || "N/A",
        zipCode: org.zipCode || "N/A",
        status: org.status || "ACTIVE",
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        adminName: orgAdmin ? orgAdmin.name : "Unassigned",
        adminEmail: orgAdmin ? orgAdmin.email : "N/A",
        userCount: org._count.users,
        leadCount: org._count.leads,
        activityCount: org._count.leadActivities + org._count.whatsAppActivities,
      };
    });

    return NextResponse.json({
      organizations: formattedOrgs,
      summary: {
        totalOrganizations: organizations.length,
        activeOrganizations: organizations.filter((o) => o.status === "ACTIVE").length,
        suspendedOrganizations: organizations.filter((o) => o.status === "SUSPENDED").length,
        totalPlatformLeads,
        totalPlatformUsers,
        totalSystemErrors,
        totalContactQueries,
        pendingContactQueries,
      },
    });
  } catch (error: any) {
    console.error("Super Admin fetch organizations error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch organizations" },
      { status: statusCode }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuthUser(["SUPER_ADMIN"]);
    const body = await req.json();
    const { organizationId, status, name, city, state } = body;

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (status && ["ACTIVE", "SUSPENDED"].includes(status)) {
      updateData.status = status;
    }
    if (name) updateData.name = name;
    if (city) updateData.city = city;
    if (state) updateData.state = state;

    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      organization: updatedOrg,
    });
  } catch (error: any) {
    console.error("Super Admin patch organization error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to update organization" },
      { status: statusCode }
    );
  }
}
