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

    // Vercel serverless request & response payloads have a strict 4.5MB limit
    if (file.size > 4.2 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 4.2MB limit for Vercel serverless functions. Please use the Audio Trimmer to optimize your clip (<60s) or provide an external URL.`,
        },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const isVercel = process.env.VERCEL === "1";
    if (isVercel) {
      const mime = file.type || "application/octet-stream";
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

    // Clean filename
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
