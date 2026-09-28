import { NextRequest, NextResponse } from "next/server";
import { deleteGalleryItem } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    await deleteGalleryItem(params.id);
    return NextResponse.json({ success: true, message: "Gallery image deleted" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to delete gallery item" }, { status: 500 });
  }
}
