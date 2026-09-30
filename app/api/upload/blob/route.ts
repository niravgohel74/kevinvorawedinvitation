import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const authenticated = await isAuthenticated();
        if (!authenticated) throw new Error("Unauthorized upload request.");
        if (!pathname.startsWith("music/")) throw new Error("Invalid upload destination.");

        return {
          allowedContentTypes: ["audio/*", "application/octet-stream"],
          maximumSizeInBytes: 50 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ type: "wedding-music" }),
        };
      },
      onUploadCompleted: async () => {
        // Track metadata is saved by /api/music after the browser receives the Blob URL.
      },
    });

    return NextResponse.json(response);
  } catch (error: any) {
    const message = String(error?.message || "Audio upload authorization failed.");
    const missingStore = message.includes("BLOB_READ_WRITE_TOKEN") || message.toLowerCase().includes("blob store");

    return NextResponse.json(
      {
        success: false,
        error: missingStore
          ? "Vercel Blob is not connected. Create a Blob store in the project's Storage tab and redeploy."
          : message,
      },
      { status: missingStore ? 503 : message.includes("Unauthorized") ? 401 : 400 }
    );
  }
}
