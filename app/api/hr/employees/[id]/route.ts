import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationContext } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getOrganizationContext(req);
    const { id } = params;

    const employee = await prisma.employee.findFirst({
      where: {
        id,
        organizationId: context.organizationId,
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
        joiningDate: true,
        exitDate: true,
        status: true,
        employmentType: true,
        userId: true,
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        department: {
          select: { id: true, name: true, code: true, description: true },
        },
        designation: {
          select: { id: true, title: true, code: true },
        },
        manager: {
          select: { id: true, firstName: true, lastName: true, employeeId: true },
        },
        emergencyContactName: true,
        emergencyContactPhone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ employee });
  } catch (error: any) {
    console.error("Fetch employee detail error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch employee details" },
      { status: statusCode }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getOrganizationContext(req, ["ORG_ADMIN", "ADMIN", "SUPER_ADMIN"]);
    const { id } = params;

    const existing = await prisma.employee.findFirst({
      where: { id, organizationId: context.organizationId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      phone,
      gender,
      dateOfBirth,
      joiningDate,
      exitDate,
      status,
      employmentType,
      departmentId,
      designationId,
      managerId,
      emergencyContactName,
      emergencyContactPhone,
    } = body;

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        firstName: firstName !== undefined ? String(firstName).trim() : undefined,
        lastName: lastName !== undefined ? String(lastName).trim() : undefined,
        phone: phone !== undefined ? (phone ? String(phone).trim() : null) : undefined,
        gender: gender !== undefined ? (gender ? String(gender).trim() : null) : undefined,
        dateOfBirth: dateOfBirth !== undefined ? (dateOfBirth ? new Date(dateOfBirth) : null) : undefined,
        joiningDate: joiningDate !== undefined ? new Date(joiningDate) : undefined,
        exitDate: exitDate !== undefined ? (exitDate ? new Date(exitDate) : null) : undefined,
        status: status !== undefined ? String(status).toUpperCase() : undefined,
        employmentType: employmentType !== undefined ? String(employmentType).toUpperCase() : undefined,
        departmentId: departmentId !== undefined ? (departmentId || null) : undefined,
        designationId: designationId !== undefined ? (designationId || null) : undefined,
        managerId: managerId !== undefined ? (managerId || null) : undefined,
        emergencyContactName: emergencyContactName !== undefined ? (emergencyContactName ? String(emergencyContactName).trim() : null) : undefined,
        emergencyContactPhone: emergencyContactPhone !== undefined ? (emergencyContactPhone ? String(emergencyContactPhone).trim() : null) : undefined,
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        employmentType: true,
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, employee: updated });
  } catch (error: any) {
    console.error("Update employee error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to update employee" },
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
    const { id } = params;

    const existing = await prisma.employee.findFirst({
      where: { id, organizationId: context.organizationId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Soft deactivation (status: TERMINATED, exitDate: now)
    const deactivated = await prisma.employee.update({
      where: { id },
      data: {
        status: "TERMINATED",
        exitDate: new Date(),
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        status: true,
        exitDate: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Employee ${deactivated.firstName} ${deactivated.lastName} deactivated successfully`,
      employee: deactivated,
    });
  } catch (error: any) {
    console.error("Deactivate employee error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to deactivate employee" },
      { status: statusCode }
    );
  }
}
