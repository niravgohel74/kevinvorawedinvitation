import { NextRequest, NextResponse } from "next/server";
import { getWishes, addWish, updateWishStatus, deleteWish } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const wishes = await getWishes();
    const url = new URL(req.url);
    const showAll = url.searchParams.get("all") === "true";

    if (showAll) {
      const authed = await isAuthenticated();
      if (!authed) {
        return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
      }
      return NextResponse.json({ success: true, data: wishes });
    }

    // Public gets only approved wishes
    const approved = wishes.filter((w) => w.status === "approved");
    return NextResponse.json({ success: true, data: approved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to fetch wishes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, message } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }
    if (!message || typeof message !== "string" || message.trim() === "") {
      return NextResponse.json({ success: false, error: "A blessing or message is required" }, { status: 400 });
    }

    const created = await addWish({
      name: name.trim(),
      message: message.trim(),
    });

    return NextResponse.json({
      success: true,
      message: "Your warm wishes have been received and will appear once reviewed. Thank you!",
      data: created,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to submit wish" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status } = body;
    if (!id || !["pending", "approved", "hidden"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid wish status update" }, { status: 400 });
    }

    const updated = await updateWishStatus(id, status);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to update wish" }, { status: 500 });
  }
}
