import { NextResponse } from "next/server";
import { getShowcaseConfig } from "@/lib/showcase-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const slides = getShowcaseConfig();
    return NextResponse.json({ success: true, slides });
  } catch (error) {
    console.error("GET /api/showcase error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch showcase configuration" },
      { status: 500 }
    );
  }
}
