import { NextRequest, NextResponse } from "next/server";
import { deleteWish } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    await deleteWish(params.id);
    return NextResponse.json({ success: true, message: "Wish deleted" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to delete wish" }, { status: 500 });
  }
}
