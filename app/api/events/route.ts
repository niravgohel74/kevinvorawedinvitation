import { NextRequest, NextResponse } from "next/server";
import { getEvents, createEvent, reorderEvents } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  try {
    const events = await getEvents();
    return NextResponse.json({ success: true, data: events });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.name || !body.date) {
      return NextResponse.json({ success: false, error: "Event name and date are required" }, { status: 400 });
    }

    const created = await createEvent({
      name: body.name,
      date: body.date,
      time: body.time || "",
      venue: body.venue || "",
      address: body.address || "",
      description: body.description || "",
      dressCode: body.dressCode || "",
      image: body.image || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000&auto=format&fit=crop",
      mapsUrl: body.mapsUrl || "",
      order: Number(body.order) || 99,
    });

    return NextResponse.json({ success: true, data: created });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to create event" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    if (Array.isArray(body.orderIds)) {
      const reordered = await reorderEvents(body.orderIds);
      return NextResponse.json({ success: true, data: reordered });
    }

    return NextResponse.json({ success: false, error: "Invalid reorder payload" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to reorder events" }, { status: 500 });
  }
}
