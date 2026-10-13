import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationContext } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getOrganizationContext(req, ["ORG_ADMIN", "ADMIN", "SUPER_ADMIN"]);
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Counsellor ID is required" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        id,
        organizationId: context.organizationId,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Counsellor not found" },
        { status: 404 }
      );
    }

    if (targetUser.role !== "COUNSELLOR") {
      return NextResponse.json(
        { error: "Only accounts with the COUNSELLOR role can be terminated" },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Counsellor ${targetUser.name} has been terminated successfully.`,
    });
  } catch (error: any) {
    console.error("Terminate counsellor error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to terminate counsellor" },
      { status: statusCode }
    );
  }
}
