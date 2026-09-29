import { NextRequest, NextResponse } from "next/server";
import { getMusicLibrary, getWeddingData } from "@/lib/db";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

/**
 * High-performance Audio Streaming Endpoint with HTTP 206 Partial Content Range support.
 * Solves Safari, iOS, and mobile Chrome playback issues with data URIs and local files.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const trackId = searchParams.get("id");
    const filePathParam = searchParams.get("file");

    let audioBuffer: Buffer | null = null;
    let mimeType = "audio/mpeg";

    if (trackId) {
      const library = await getMusicLibrary();
      const track = library.find((t) => t.id === trackId);
      
      let trackUrl: string | undefined = track?.url;
      if (!trackUrl) {
        const wedding = await getWeddingData();
        trackUrl = wedding.wedding.ambientMusicUrl;
      }

      if (trackUrl && trackUrl.startsWith("data:")) {
        const parts = trackUrl.split(",");
        const mimeMatch = parts[0].match(/data:(.*?);base64/);
        if (mimeMatch && mimeMatch[1]) {
          mimeType = mimeMatch[1];
        }
        audioBuffer = Buffer.from(parts[1], "base64");
      } else if (trackUrl && trackUrl.startsWith("/uploads/")) {
        const localPath = path.join(process.cwd(), "public", trackUrl);
        if (fs.existsSync(localPath)) {
          audioBuffer = fs.readFileSync(localPath);
          mimeType = trackUrl.endsWith(".wav") ? "audio/wav" : "audio/mpeg";
        }
      }
    } else if (filePathParam) {
      const safePath = path.normalize(filePathParam).replace(/^(\.\.[\/\\])+/, "");
      const fullPath = path.join(process.cwd(), "public", safePath);
      if (fs.existsSync(fullPath)) {
        audioBuffer = fs.readFileSync(fullPath);
        mimeType = safePath.endsWith(".wav") ? "audio/wav" : "audio/mpeg";
      }
    }

    if (!audioBuffer) {
      return NextResponse.json({ success: false, error: "Audio track not found" }, { status: 404 });
    }

    const totalBytes = audioBuffer.length;
    const rangeHeader = req.headers.get("range");

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalBytes - 1;
      const chunkSize = end - start + 1;
      const chunk = audioBuffer.subarray(start, end + 1);

      return new NextResponse(new Uint8Array(chunk), {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${totalBytes}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        "Content-Length": totalBytes.toString(),
        "Content-Type": mimeType,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to stream audio" },
      { status: 500 }
    );
  }
}
