import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationContext, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const context = await getOrganizationContext(req);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim().toUpperCase() || "ALL";
    const departmentId = searchParams.get("departmentId")?.trim() || "";
    const designationId = searchParams.get("designationId")?.trim() || "";

    const skip = (page - 1) * limit;

    const where: any = {
      organizationId: context.organizationId,
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (designationId) {
      where.designationId = designationId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { employeeId: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    // Auto-sync existing Organization Users to Employee table if no employees exist yet
    const existingCount = await prisma.employee.count({
      where: { organizationId: context.organizationId },
    });

    if (existingCount === 0) {
      const orgUsers = await prisma.user.findMany({
        where: { organizationId: context.organizationId },
      });

      for (let i = 0; i < orgUsers.length; i++) {
        const u = orgUsers[i];
        const nameParts = u.name.trim().split(" ");
        const firstName = nameParts[0] || "Staff";
        const lastName = nameParts.slice(1).join(" ") || "Member";
        const empId = `EMP-${1000 + i + 1}`;

        await prisma.employee.create({
          data: {
            organizationId: context.organizationId,
            userId: u.id,
            employeeId: empId,
            firstName,
            lastName,
            email: u.email,
            status: "ACTIVE",
            employmentType: "FULL_TIME",
          },
        }).catch(() => {}); // Ignore duplicate email errors if any
      }
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
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
            select: { id: true, name: true, code: true },
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
        orderBy: { createdAt: "desc" },
      }),
      prisma.employee.count({ where }),
    ]);

    return NextResponse.json({
      employees,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Fetch employees error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch employees" },
      { status: statusCode }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getOrganizationContext(req, ["ORG_ADMIN", "ADMIN", "SUPER_ADMIN"]);

    const body = await req.json();
    const {
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      gender,
      dateOfBirth,
      joiningDate,
      status,
      employmentType,
      departmentId,
      designationId,
      managerId,
      emergencyContactName,
      emergencyContactPhone,
      createUserAccount,
      userRole,
      userPassword,
    } = body;

    const normalizedEmail = String(email || "").trim().toLowerCase();
    let normalizedEmpId = String(employeeId || "").trim().toUpperCase();

    if (!normalizedEmail || !firstName) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    if (!normalizedEmpId) {
      const count = await prisma.employee.count({
        where: { organizationId: context.organizationId },
      });
      normalizedEmpId = `EMP-${1000 + count + 1}`;
    }

    const finalFirstName = String(firstName).trim();
    const finalLastName = String(lastName || "").trim() || "Staff";

    // Check duplicate employee ID or email in org
    const existingEmp = await prisma.employee.findFirst({
      where: {
        organizationId: context.organizationId,
        OR: [
          { employeeId: normalizedEmpId },
          { email: normalizedEmail },
        ],
      },
    });

    if (existingEmp) {
      return NextResponse.json(
        { error: "Employee with this ID or Email already exists in the organization" },
        { status: 409 }
      );
    }

    // Execute employee creation transactionally
    const result = await prisma.$transaction(async (tx) => {
      let createdUserId: string | null = null;

      if (createUserAccount) {
        if (!userPassword) {
          throw new Error("Password is required when creating a linked user account");
        }

        const existingUser = await tx.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (existingUser) {
          createdUserId = existingUser.id;
        } else {
          const passwordHash = await hashPassword(userPassword);
          const newUser = await tx.user.create({
            data: {
              organizationId: context.organizationId,
              name: `${finalFirstName} ${finalLastName}`.trim(),
              email: normalizedEmail,
              passwordHash,
              role: userRole || "COUNSELLOR",
            },
          });
          createdUserId = newUser.id;
        }
      }

      const newEmployee = await tx.employee.create({
        data: {
          organizationId: context.organizationId,
          userId: createdUserId,
          employeeId: normalizedEmpId,
          firstName: finalFirstName,
          lastName: finalLastName,
          email: normalizedEmail,
          phone: phone ? String(phone).trim() : null,
          gender: gender ? String(gender).trim() : null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
          status: status || "ACTIVE",
          employmentType: employmentType || "FULL_TIME",
          departmentId: departmentId || null,
          designationId: designationId || null,
          managerId: managerId || null,
          emergencyContactName: emergencyContactName ? String(emergencyContactName).trim() : null,
          emergencyContactPhone: emergencyContactPhone ? String(emergencyContactPhone).trim() : null,
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
          joiningDate: true,
          department: { select: { id: true, name: true } },
          designation: { select: { id: true, title: true } },
          createdAt: true,
        },
      });

      return newEmployee;
    });

    return NextResponse.json({ success: true, employee: result }, { status: 201 });
  } catch (error: any) {
    console.error("Create employee error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to create employee" },
      { status: statusCode }
    );
  }
}
