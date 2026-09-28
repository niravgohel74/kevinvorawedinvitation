import { NextRequest, NextResponse } from "next/server";
import { updateEvent, deleteEvent } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const updated = await updateEvent(params.id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    await deleteEvent(params.id);
    return NextResponse.json({ success: true, message: "Event deleted" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to delete event" }, { status: 500 });
  }
}
