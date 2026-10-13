import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth";
import { getShowcaseConfig, saveShowcaseConfig, ShowcaseSlide } from "@/lib/showcase-config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAuthUser(["SUPER_ADMIN"]);
    const slides = getShowcaseConfig();
    return NextResponse.json({ success: true, slides });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Super Admin authorization required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch showcase config" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAuthUser(["SUPER_ADMIN"]);
    const body = await req.json();
    const { slides } = body;

    if (!Array.isArray(slides)) {
      return NextResponse.json({ error: "Invalid payload: slides array required" }, { status: 400 });
    }

    const sanitizedSlides: ShowcaseSlide[] = slides
      .filter((s: any) => s && typeof s.imageUrl === "string" && s.imageUrl.trim().length > 0)
      .map((s: any, idx: number) => ({
        id: s.id || `slide-${Date.now()}-${idx}`,
        imageUrl: s.imageUrl.trim(),
        title: s.title || `Showcase Image ${idx + 1}`,
        createdAt: s.createdAt || new Date().toISOString(),
      }));

    const success = saveShowcaseConfig(sanitizedSlides);
    if (!success) {
      return NextResponse.json({ error: "Failed to persist configuration" }, { status: 500 });
    }

    return NextResponse.json({ success: true, slides: sanitizedSlides });
  } catch (error: any) {
    console.error("PUT /api/super-admin/showcase error:", error);
    if (error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Super Admin authorization required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
