import { NextRequest, NextResponse } from "next/server";
import { getRSVPs, addRSVP } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const rsvps = await getRSVPs();
    return NextResponse.json({ success: true, data: rsvps });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to fetch RSVPs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, guestsCount, attending, dietaryPreference, message } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ success: false, error: "Your name is required." }, { status: 400 });
    }
    if (!attending || (attending !== "yes" && attending !== "no")) {
      return NextResponse.json({ success: false, error: "Please indicate if you will attend." }, { status: 400 });
    }

    const created = await addRSVP({
      name: name.trim(),
      phone: phone ? phone.trim() : "",
      guestsCount: Number(guestsCount) || 1,
      attending,
      dietaryPreference: dietaryPreference ? dietaryPreference.trim() : "None",
      message: message ? message.trim() : "",
    });

    return NextResponse.json({
      success: true,
      message: attending === "yes"
        ? "Thank you! Your presence will make our celebration complete."
        : "Thank you for letting us know. You will be dearly missed!",
      data: created,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to submit RSVP" }, { status: 500 });
  }
}
