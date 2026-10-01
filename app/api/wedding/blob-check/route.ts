import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { syncCurrentStoreToBlob } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const isVercel = process.env.VERCEL === "1";

  if (!token) {
    return NextResponse.json({
      configured: false,
      isVercel,
      message:
        "BLOB_READ_WRITE_TOKEN is missing. If you are on localhost, copy the token from Vercel Blob store (.env.local tab) into your local .env.local file. If you are deployed on Vercel, link the Blob store to your project.",
      blobs: [],
    });
  }

  try {
    const listRes = await list({ limit: 100 });
    const storeBlob = listRes.blobs.find(
      (b) => b.pathname === "wedding-data/store.json"
    );

    return NextResponse.json({
      configured: true,
      isVercel,
      tokenPreview: `${token.slice(0, 15)}...${token.slice(-4)}`,
      storeBlobFound: Boolean(storeBlob),
      storeBlobDetails: storeBlob || null,
      totalBlobsInStore: listRes.blobs.length,
      blobs: listRes.blobs.map((b) => ({
        pathname: b.pathname,
        size: b.size,
        uploadedAt: b.uploadedAt,
        url: b.url,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        configured: true,
        isVercel,
        tokenPreview: `${token.slice(0, 15)}...${token.slice(-4)}`,
        error: err?.message || String(err),
        blobs: [],
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await syncCurrentStoreToBlob();
    return NextResponse.json({
      success: result.blobSaved,
      result,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
