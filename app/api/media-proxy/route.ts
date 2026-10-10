import { NextRequest, NextResponse } from "next/server";
import { getBlobToken } from "@/lib/db";

export const dynamic = "force-dynamic";

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  avif: "image/avif",
  ico: "image/x-icon",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  mp4: "video/mp4",
  webm: "video/webm",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return NextResponse.json({ success: false, error: "Missing url parameter" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid URL" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json({ success: false, error: "Only HTTP/HTTPS allowed" }, { status: 400 });
    }

    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "*/*",
    };

    // Forward range header if browser requests partial content (crucial for audio/video)
    const clientRange = req.headers.get("range");
    if (clientRange) {
      headers["Range"] = clientRange;
    }

    // Attach Vercel Blob token if fetching from Vercel storage
    if (parsedUrl.hostname.includes("blob.vercel-storage.com")) {
      const token = getBlobToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(targetUrl, { headers });

    if (!response.ok && response.status !== 206) {
      // If Vercel Blob returns 403 Forbidden because store is suspended, redirect to fallback asset
      if (response.status === 403 && parsedUrl.hostname.includes("blob.vercel-storage.com")) {
        console.warn("[Media Proxy] Upstream Blob suspended (403), redirecting to fallback asset.");
        return NextResponse.redirect(new URL("/images/hero-wedding.jpg", req.url), 307);
      }

      return NextResponse.json(
        { success: false, error: `Failed to fetch remote media (${response.status})` },
        { status: response.status }
      );
    }

    // Determine correct content type
    let contentType = response.headers.get("content-type");
    const extMatch = parsedUrl.pathname.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : "";

    if (!contentType || contentType === "application/octet-stream" || contentType === "text/plain") {
      if (ext && MIME_MAP[ext]) {
        contentType = MIME_MAP[ext];
      } else {
        contentType = "image/jpeg";
      }
    }

    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=31536000, immutable",
    };

    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      responseHeaders["Content-Length"] = contentLength;
    }

    const contentRange = response.headers.get("content-range");
    if (contentRange) {
      responseHeaders["Content-Range"] = contentRange;
      responseHeaders["Accept-Ranges"] = "bytes";
    }

    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Media proxy failed" },
      { status: 500 }
    );
  }
}
