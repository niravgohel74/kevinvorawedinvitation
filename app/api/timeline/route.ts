import { NextRequest, NextResponse } from "next/server";
import { getWeddingData, updateTimeline } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  try {
    const data = await getWeddingData();
    return NextResponse.json({ success: true, data: data.timeline });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to fetch timeline" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Invalid timeline data format" }, { status: 400 });
    }

    const { data: updated, sync } = await updateTimeline(body);
    return NextResponse.json({
      success: true,
      data: updated,
      blobSaved: sync?.blobSaved ?? true,
      blobConfigured: sync?.isConfigured ?? true,
      isStoreBlocked: sync?.isStoreBlocked ?? false,
      blobError: sync?.blobError,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to update timeline" }, { status: 500 });
  }
}
