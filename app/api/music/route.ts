import { NextRequest, NextResponse } from "next/server";
import { getMusicLibrary, addMusicTrack, setActiveMusicTrack, updateMusicTrack, deleteMusicTrack } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  try {
    const library = await getMusicLibrary();
    return NextResponse.json({ success: true, data: library });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to fetch music library" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.title || !body.url) {
      return NextResponse.json({ success: false, error: "Title and audio URL are required" }, { status: 400 });
    }

    const created = await addMusicTrack({
      title: body.title.trim(),
      artist: body.artist ? body.artist.trim() : "Unknown Artist",
      url: body.url.trim(),
      isActive: Boolean(body.isActive),
    });

    return NextResponse.json({ success: true, data: created });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to add track" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    if (body.action === "set_active" && body.id) {
      const active = await setActiveMusicTrack(body.id);
      return NextResponse.json({ success: true, data: active });
    }

    if (body.action === "update" && body.id) {
      const updated = await updateMusicTrack(body.id, body.updates || {});
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to update music track" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Track ID required" }, { status: 400 });
    }

    await deleteMusicTrack(id);
    return NextResponse.json({ success: true, message: "Music track removed" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to delete track" }, { status: 500 });
  }
}
