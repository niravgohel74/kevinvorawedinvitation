import { NextRequest, NextResponse } from "next/server";
import { getWeddingData, updateWeddingDetails, restoreWeddingData, getStoreVersion } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const data = await getWeddingData(true);
    const timestamp = data.wedding?.updatedAt ? new Date(data.wedding.updatedAt).getTime() : 0;
    const version = Math.max(timestamp, getStoreVersion());
    return NextResponse.json(
      { success: true, data, version },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "CDN-Cache-Control": "no-store",
          "Vercel-CDN-Cache-Control": "no-store",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to fetch wedding data" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const updated = await updateWeddingDetails(body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to update wedding details" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { data: restored, sync } = await restoreWeddingData(body);
    return NextResponse.json({
      success: true,
      data: restored,
      blobSaved: sync.blobSaved,
      isConfigured: sync.isConfigured,
      blobError: sync.blobError,
      url: sync.url,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to restore wedding data" }, { status: 500 });
  }
}
