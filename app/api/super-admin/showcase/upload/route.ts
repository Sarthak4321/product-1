import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth";
import { uploadToR2, isR2Configured } from "@/lib/r2";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await requireAuthUser(["SUPER_ADMIN"]);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const serviceId = (formData.get("serviceId") as string) || "showcase";

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Check mime type
    const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"];
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PNG, JPG, WEBP, or SVG image." },
        { status: 400 }
      );
    }

    // Max 15MB limit for R2
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "Image size must be under 15MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize extension and filename for R2 key
    const ext = path.extname(file.name) || (file.type === "image/png" ? ".png" : ".jpg");
    const sanitizedServiceId = serviceId.replace(/[^a-zA-Z0-9_-]/g, "");
    const key = `showcase/${sanitizedServiceId}-${Date.now()}${ext}`;

    if (isR2Configured()) {
      // Upload directly to Cloudflare R2
      const result = await uploadToR2({
        buffer,
        key,
        contentType: file.type,
      });

      return NextResponse.json({
        success: true,
        url: result.url,
        key: result.key,
        storage: "cloudflare_r2",
      });
    } else {
      // Return clear configuration instruction if R2 env vars are missing
      return NextResponse.json(
        {
          error:
            "Cloudflare R2 is not configured on the server. Please add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME to your Vercel/environment variables.",
          storage: "unconfigured",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("POST /api/super-admin/showcase/upload error:", error);
    if (error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Super Admin authorization required" }, { status: 403 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to upload image to Cloudflare R2" },
      { status: 500 }
    );
  }
}

