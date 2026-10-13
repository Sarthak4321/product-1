import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationContext } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const context = await getOrganizationContext(req);

    const departments = await prisma.department.findMany({
      where: { organizationId: context.organizationId },
      include: {
        _count: {
          select: {
            employees: true,
            designations: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ departments });
  } catch (error: any) {
    console.error("Fetch departments error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch departments" },
      { status: statusCode }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getOrganizationContext(req, ["ORG_ADMIN", "ADMIN", "SUPER_ADMIN"]);

    const body = await req.json();
    const { name, code, description } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const existing = await prisma.department.findUnique({
      where: {
        organizationId_name: {
          organizationId: context.organizationId,
          name: trimmedName,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Department "${trimmedName}" already exists` },
        { status: 409 }
      );
    }

    const department = await prisma.department.create({
      data: {
        organizationId: context.organizationId,
        name: trimmedName,
        code: code ? String(code).trim().toUpperCase() : null,
        description: description ? String(description).trim() : null,
      },
    });

    return NextResponse.json({ success: true, department }, { status: 201 });
  } catch (error: any) {
    console.error("Create department error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to create department" },
      { status: statusCode }
    );
  }
}
