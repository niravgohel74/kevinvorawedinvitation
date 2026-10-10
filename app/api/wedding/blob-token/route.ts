import { NextRequest, NextResponse } from "next/server";
import {
  getBlobToken,
  setBlobTokenOverride,
  checkBlobStoreHealth,
  writeBlobStore,
  getWeddingData,
} from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const token = getBlobToken();
  const health = await checkBlobStoreHealth(token);
  return NextResponse.json({
    success: true,
    configured: Boolean(token),
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
    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (!token) {
      // Clear token override
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

    // 1. Check health and ability to write to the store using this token
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

    // 2. Token verified! Set runtime override
    setBlobTokenOverride(token);

    return NextResponse.json({
      success: true,
      message: "Successfully verified and connected new Vercel Blob store! Wedding data synchronized.",
      url: writeResult.url,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to test or set Blob token" },
      { status: 500 }
    );
  }
}
