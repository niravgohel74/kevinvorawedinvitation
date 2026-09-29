import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded." }, { status: 400 });
    }

    const isVercel = process.env.VERCEL === "1";

    // Vercel serverless request & response payloads have a strict 4.5MB limit.
    // In local development, allow up to 35MB for high-fidelity 320kbps full audio tracks.
    const maxSizeBytes = isVercel ? 4.2 * 1024 * 1024 : 35 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const limitMb = isVercel ? "4.2MB" : "35MB";
      return NextResponse.json(
        {
          success: false,
          error: `File size (${sizeMb}MB) exceeds the ${limitMb} limit for ${isVercel ? "Vercel serverless functions" : "upload"}. Please use the Audio Trimmer to optimize your clip or provide an external audio URL.`,
        },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (isVercel) {
      const mime = file.type || "audio/mpeg";
      const base64Data = buffer.toString("base64");
      const dataUri = `data:${mime};base64,${base64Data}`;
      return NextResponse.json({
        success: true,
        url: dataUri,
        fileName: file.name,
      });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Clean filename preserving extension
    const cleanName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(uploadsDir, cleanName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${cleanName}`;
    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "File upload failed" },
      { status: 500 }
    );
  }
}
