import { NextRequest, NextResponse } from "next/server";
import { getWeddingData, updateStory } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  try {
    const data = await getWeddingData();
    return NextResponse.json({ success: true, data: data.story });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to fetch story" }, { status: 500 });
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
      return NextResponse.json({ success: false, error: "Invalid story data format" }, { status: 400 });
    }

    const updated = await updateStory(body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to update story" }, { status: 500 });
  }
}
