import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAuthUser(["SUPER_ADMIN"]);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search")?.trim() || "";

    const whereClause: any = {};

    if (status !== "ALL") {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { instituteName: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const [queries, totalCount, pendingCount, contactedCount, resolvedCount, archivedCount] =
      await Promise.all([
        (prisma as any).contactQuery.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
        }),
        (prisma as any).contactQuery.count(),
        (prisma as any).contactQuery.count({ where: { status: "PENDING" } }),
        (prisma as any).contactQuery.count({ where: { status: "CONTACTED" } }),
        (prisma as any).contactQuery.count({ where: { status: "RESOLVED" } }),
        (prisma as any).contactQuery.count({ where: { status: "ARCHIVED" } }),
      ]);

    return NextResponse.json({
      queries,
      summary: {
        total: totalCount,
        pending: pendingCount,
        contacted: contactedCount,
        resolved: resolvedCount,
        archived: archivedCount,
      },
    });
  } catch (error: any) {
    console.error("Super Admin fetch contact queries error:", error);
    const statusCode =
      error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch contact queries" },
      { status: statusCode }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuthUser(["SUPER_ADMIN"]);

    const body = await req.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Contact query ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (status && ["PENDING", "CONTACTED", "RESOLVED", "ARCHIVED"].includes(status)) {
      updateData.status = status;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updated = await (prisma as any).contactQuery.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      query: updated,
    });
  } catch (error: any) {
    console.error("Super Admin update contact query error:", error);
    const statusCode =
      error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to update contact query" },
      { status: statusCode }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuthUser(["SUPER_ADMIN"]);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Contact query ID is required" }, { status: 400 });
    }

    await (prisma as any).contactQuery.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Contact query deleted successfully",
    });
  } catch (error: any) {
    console.error("Super Admin delete contact query error:", error);
    const statusCode =
      error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to delete contact query" },
      { status: statusCode }
    );
  }
}
