import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { syncCurrentStoreToBlob, getBlobToken, checkBlobStoreHealth } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const token = getBlobToken();
  const isVercel = process.env.VERCEL === "1";

  if (!token) {
    const relevantKeys = Object.keys(process.env).filter(
      (k) => k.includes("TOKEN") || k.includes("BLOB") || k.includes("STORAGE") || k.includes("KEVIN")
    );
    return NextResponse.json({
      configured: false,
      isVercel,
      relevantKeys,
      allKeysCount: Object.keys(process.env).length,
      message:
        "BLOB_READ_WRITE_TOKEN is missing. If you are on localhost, copy the token from Vercel Blob store (.env.local tab) into your local .env.local file. If you are deployed on Vercel, check Environment Variables in Vercel Dashboard.",
      blobs: [],
    });
  }

  const health = await checkBlobStoreHealth(token);

  let blobs: any[] = [];
  let storeBlobDetails: any = null;

  try {
    const listRes = await list({ limit: 100, token });
    storeBlobDetails = listRes.blobs.find((b) => b.pathname === "wedding-data/store.json") || null;
    blobs = listRes.blobs.map((b) => ({
      pathname: b.pathname,
      size: b.size,
      uploadedAt: b.uploadedAt,
      url: b.url,
    }));
  } catch {}

  return NextResponse.json({
    configured: true,
    isVercel,
    tokenPreview: health.tokenPreview,
    isStoreBlocked: health.isStoreBlocked,
    blockReason: health.blockReason || null,
    canRead: health.canRead,
    canWrite: health.canWrite,
    storeBlobFound: health.storeBlobFound,
    storeBlobDetails,
    totalBlobsInStore: health.totalBlobsInStore,
    blobs,
  });
}

export async function POST() {
  try {
    const result = await syncCurrentStoreToBlob();
    return NextResponse.json({
      success: result.blobSaved,
      isStoreBlocked: Boolean(result.isStoreBlocked),
      error: result.blobError || null,
      result,
    });
  } catch (err: any) {
    const msg = err?.message || String(err);
    const isSuspended = msg.toLowerCase().includes("suspend") || msg.toLowerCase().includes("block") || err?.status === 403;
    return NextResponse.json(
      {
        success: false,
        isStoreBlocked: isSuspended,
        error: msg,
      },
      { status: 500 }
    );
  }
}
