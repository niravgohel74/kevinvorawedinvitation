import { NextRequest, NextResponse } from "next/server";
import { getGallery, addGalleryItem, updateGallery } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  try {
    const gallery = await getGallery();
    return NextResponse.json({ success: true, data: gallery });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to fetch gallery" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.url) {
      return NextResponse.json({ success: false, error: "Image URL is required" }, { status: 400 });
    }

    const created = await addGalleryItem({
      url: body.url,
      caption: body.caption || "",
      category: body.category || "candid",
      aspect: body.aspect || "landscape",
      order: Number(body.order) || 99,
    });

    return NextResponse.json({ success: true, data: created });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to add gallery image" }, { status: 500 });
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
      return NextResponse.json({ success: false, error: "Invalid gallery payload" }, { status: 400 });
    }

    const updated = await updateGallery(body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to update gallery" }, { status: 500 });
  }
}
