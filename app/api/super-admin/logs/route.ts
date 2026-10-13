import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth";
import { logError } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    // Authenticate user strictly as SUPER_ADMIN
    const user = await requireAuthUser(["SUPER_ADMIN"]);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = searchParams.get("search")?.trim() || "";

    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { message: { contains: search } },
        { stack: { contains: search } },
        { context: { contains: search } },
      ];
    }

    const [errors, total] = await Promise.all([
      prisma.systemErrorLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.systemErrorLog.count({ where }),
    ]);

    return NextResponse.json({
      errors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("Super Admin system error log query error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch error logs" },
      { status: statusCode }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser(["SUPER_ADMIN"]);

    const testError = new Error("Platform System Exception: Sample test exception triggered from Super Admin Governance Panel");
    logError(testError, "Sample test exception triggered from Super Admin Panel", {
      userId: user.userId,
      userRole: user.role,
      route: "/super-admin/logs",
      environment: process.env.NODE_ENV || "development",
    });

    return NextResponse.json({ success: true, message: "Platform test error logged successfully" });
  } catch (error: any) {
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to trigger test error" },
      { status: statusCode }
    );
  }
}
