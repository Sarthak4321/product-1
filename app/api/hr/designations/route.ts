import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationContext } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const context = await getOrganizationContext(req);
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId") || undefined;

    const designations = await prisma.designation.findMany({
      where: {
        organizationId: context.organizationId,
        departmentId: departmentId || undefined,
      },
      include: {
        department: {
          select: { id: true, name: true },
        },
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { title: "asc" },
    });

    return NextResponse.json({ designations });
  } catch (error: any) {
    console.error("Fetch designations error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch designations" },
      { status: statusCode }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getOrganizationContext(req, ["ORG_ADMIN", "ADMIN", "SUPER_ADMIN"]);

    const body = await req.json();
    const { title, departmentId, code } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Designation title is required" },
        { status: 400 }
      );
    }

    const trimmedTitle = title.trim();
    const existing = await prisma.designation.findUnique({
      where: {
        organizationId_title: {
          organizationId: context.organizationId,
          title: trimmedTitle,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Designation "${trimmedTitle}" already exists` },
        { status: 409 }
      );
    }

    if (departmentId) {
      const deptExists = await prisma.department.findFirst({
        where: { id: departmentId, organizationId: context.organizationId },
      });
      if (!deptExists) {
        return NextResponse.json(
          { error: "Specified department not found" },
          { status: 404 }
        );
      }
    }

    const designation = await prisma.designation.create({
      data: {
        organizationId: context.organizationId,
        title: trimmedTitle,
        departmentId: departmentId || null,
        code: code ? String(code).trim().toUpperCase() : null,
      },
      include: {
        department: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, designation }, { status: 201 });
  } catch (error: any) {
    console.error("Create designation error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to create designation" },
      { status: statusCode }
    );
  }
}
