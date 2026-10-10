import { NextRequest, NextResponse } from "next/server";
import {
  getBlobToken,
  setBlobTokenOverride,
  getUpstashConfig,
  setUpstashConfigOverride,
  checkBlobStoreHealth,
  writeBlobStore,
  writeUpstash,
  getWeddingData,
} from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const health = await checkBlobStoreHealth();
  return NextResponse.json({
    success: true,
    configured: health.configured,
    activeProvider: health.activeProvider,
    upstashConfigured: health.upstashConfigured,
    upstashUrlPreview: health.upstashUrlPreview,
    tokenPreview: health.tokenPreview || null,
    isStoreBlocked: health.isStoreBlocked,
    blockReason: health.blockReason || null,
    canRead: health.canRead,
    canWrite: health.canWrite,
    totalBlobsInStore: health.totalBlobsInStore,
  });
}

export async function POST(req: NextRequest) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const provider = body?.provider || (body?.url ? "upstash" : "blob");

    // Case A: Upstash Redis connection
    if (provider === "upstash") {
      const url = typeof body?.url === "string" ? body.url.trim().replace(/\/+$/, "") : "";
      const token = typeof body?.token === "string" ? body.token.trim() : "";

      if (!url || !token) {
        setUpstashConfigOverride(null);
        return NextResponse.json({ success: true, message: "Cleared Upstash override." });
      }

      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return NextResponse.json(
          { success: false, error: "Invalid URL. UPSTASH_REDIS_REST_URL must start with https://" },
          { status: 400 }
        );
      }

      const currentData = await getWeddingData(false);
      const testResult = await writeUpstash(currentData, { url, token });

      if (!testResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: testResult.error || "Failed to connect to Upstash Redis. Please verify URL and REST Token.",
          },
          { status: 400 }
        );
      }

      setUpstashConfigOverride({ url, token });
      return NextResponse.json({
        success: true,
        provider: "upstash",
        message: "✅ Successfully connected to Upstash Redis! Wedding data synchronized to the cloud.",
      });
    }

    // Case B: Vercel Blob connection
    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (!token) {
      setBlobTokenOverride(null);
      return NextResponse.json({ success: true, message: "Reset to default environment variables token." });
    }

    if (!token.startsWith("vercel_blob_rw_")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid token format. A valid Vercel Blob token starts with 'vercel_blob_rw_'.",
        },
        { status: 400 }
      );
    }

    // Check health and ability to write to the store using this token
    const currentData = await getWeddingData(false);
    const writeResult = await writeBlobStore(currentData, token);

    if (!writeResult.blobSaved) {
      return NextResponse.json(
        {
          success: false,
          error: writeResult.blobError || "Failed to write store.json with the provided token.",
        },
        { status: 400 }
      );
    }

    setBlobTokenOverride(token);

    return NextResponse.json({
      success: true,
      provider: "blob",
      message: "Successfully verified and connected new Vercel Blob store! Wedding data synchronized.",
      url: writeResult.url,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to test or set database credentials" },
      { status: 500 }
    );
  }
}
