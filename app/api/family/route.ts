import { NextRequest, NextResponse } from "next/server";
import { getWeddingData, updateFamily } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  try {
    const data = await getWeddingData();
    return NextResponse.json({ success: true, data: data.family });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to fetch family info" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const result = await updateFamily(body);
    const updated = result.data || result;
    const sync = result.sync;
    return NextResponse.json({
      success: true,
      data: updated,
      blobSaved: sync?.blobSaved ?? true,
      blobConfigured: sync?.isConfigured ?? true,
      isStoreBlocked: sync?.isStoreBlocked ?? false,
      blobError: sync?.blobError,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to update family info" }, { status: 500 });
  }
}
