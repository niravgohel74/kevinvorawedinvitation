import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { getWeddingData, getBlobToken } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const data = await getWeddingData();
    let rawOg = data?.wedding?.ogImage?.trim();

    // 1. If custom OG image is set in Admin
    if (rawOg) {
      // If it was already wrapped in media-proxy, extract actual target url
      if (rawOg.includes("/api/media-proxy?url=")) {
        const parts = rawOg.split("/api/media-proxy?url=");
        if (parts[1]) {
          rawOg = decodeURIComponent(parts[1]);
        }
      }

      let fetchUrl = rawOg;
      if (rawOg.startsWith("/")) {
        const host = req.headers.get("host") || "localhost:3000";
        const proto = req.headers.get("x-forwarded-proto") || "https";
        fetchUrl = `${proto}://${host}${rawOg}`;
      }

      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "image/*,*/*",
      };

      if (fetchUrl.includes("blob.vercel-storage.com")) {
        const token = getBlobToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }

      try {
        const remoteRes = await fetch(fetchUrl, { headers });
        if (remoteRes.ok) {
          const inputBuffer = Buffer.from(await remoteRes.arrayBuffer());

          // Resize and compress with sharp to guarantee < 250KB for WhatsApp
          const optimizedJpeg = await sharp(inputBuffer)
            .resize(1200, 630, {
              fit: "cover",
              position: "center",
            })
            .jpeg({
              quality: 82,
              progressive: true,
              mozjpeg: true,
            })
            .toBuffer();

          return new NextResponse(optimizedJpeg, {
            status: 200,
            headers: {
              "Content-Type": "image/jpeg",
              "Content-Length": optimizedJpeg.length.toString(),
              "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      } catch (fetchErr) {
        console.warn("[OG API] Error fetching custom OG image, using fallback:", fetchErr);
      }
    }

    // 2. Default Fallback Image from public/og-image.jpg
    const defaultImagePath = path.join(process.cwd(), "public", "og-image.jpg");
    if (fs.existsSync(defaultImagePath)) {
      const defaultBuf = fs.readFileSync(defaultImagePath);
      return new NextResponse(defaultBuf, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Length": defaultBuf.length.toString(),
          "Cache-Control": "public, max-age=86400",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return new NextResponse("Not found", { status: 404 });
  } catch (err: any) {
    console.error("[OG API] Fatal error:", err);
    return new NextResponse("OG generation error", { status: 500 });
  }
}
