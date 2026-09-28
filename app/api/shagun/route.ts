import { NextRequest, NextResponse } from "next/server";
import { getShagun, addShagun, updateShagun } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const shagun = await getShagun();
    return NextResponse.json({ success: true, data: shagun });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to fetch shagun" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.guestName || !body.amount) {
      return NextResponse.json({ success: false, error: "Guest name and amount are required" }, { status: 400 });
    }

    const created = await addShagun({
      guestName: body.guestName.trim(),
      side: body.side === "bride" ? "bride" : "groom",
      relation: body.relation ? body.relation.trim() : "",
      city: body.city ? body.city.trim() : "",
      amount: Number(body.amount) || 0,
      paymentMode: body.paymentMode || "cash",
      event: body.event || "Wedding",
      receivedBy: body.receivedBy ? body.receivedBy.trim() : "",
      notes: body.notes ? body.notes.trim() : "",
    });

    return NextResponse.json({ success: true, data: created });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to record shagun" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    const updated = await updateShagun(body.id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to update shagun" }, { status: 500 });
  }
}
