import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationContext, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const context = await getOrganizationContext(req);

    const counsellors = await prisma.user.findMany({
      where: {
        organizationId: context.organizationId,
        role: "COUNSELLOR",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            assignedLeads: true,
            activities: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ counsellors });
  } catch (error: any) {
    console.error("Fetch counsellors error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch counsellors" },
      { status: statusCode }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getOrganizationContext(req, ["ORG_ADMIN", "ADMIN", "SUPER_ADMIN"]);

    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0] || "Staff";
    const lastName = nameParts.slice(1).join(" ") || "Member";
    const randomEmpId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCounsellor = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          organizationId: context.organizationId,
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: role || "COUNSELLOR",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      await tx.employee.create({
        data: {
          organizationId: context.organizationId,
          userId: u.id,
          employeeId: randomEmpId,
          firstName,
          lastName,
          email: normalizedEmail,
          status: "ACTIVE",
          employmentType: "FULL_TIME",
        },
      }).catch(() => {});

      return u;
    });

    return NextResponse.json({ success: true, counsellor: newCounsellor });
  } catch (error: any) {
    console.error("Create counsellor error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to create counsellor" },
      { status: statusCode }
    );
  }
}
