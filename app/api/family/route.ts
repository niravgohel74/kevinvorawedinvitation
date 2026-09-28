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
    const updated = await updateFamily(body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to update family info" }, { status: 500 });
  }
}
