import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationContext } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const context = await getOrganizationContext(req, ["ORG_ADMIN", "ADMIN", "SUPER_ADMIN"]);

    const organization = await prisma.organization.findUnique({
      where: { id: context.organizationId },
      include: {
        _count: {
          select: {
            users: true,
            leads: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ organization });
  } catch (error: any) {
    console.error("Fetch organization settings error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch organization settings" },
      { status: statusCode }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const context = await getOrganizationContext(req, ["ORG_ADMIN", "ADMIN", "SUPER_ADMIN"]);

    const body = await req.json();
    const { name, phone, city, state, zipCode, email } = body;

    const updated = await prisma.organization.update({
      where: { id: context.organizationId },
      data: {
        name: name !== undefined ? String(name).trim() : undefined,
        email: email !== undefined ? String(email).trim() : undefined,
        phone: phone !== undefined ? String(phone).trim() : undefined,
        city: city !== undefined ? String(city).trim() : undefined,
        state: state !== undefined ? String(state).trim() : undefined,
        zipCode: zipCode !== undefined ? String(zipCode).trim() : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Organization settings updated successfully",
      organization: updated,
    });
  } catch (error: any) {
    console.error("Update organization settings error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to update organization settings" },
      { status: statusCode }
    );
  }
}
