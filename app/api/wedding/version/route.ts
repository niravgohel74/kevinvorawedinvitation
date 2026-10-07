import { NextResponse } from "next/server";
import { getWeddingData, getStoreVersion } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  const data = await getWeddingData(false);
  const timestamp = data.wedding?.updatedAt ? new Date(data.wedding.updatedAt).getTime() : 0;
  const version = timestamp || getStoreVersion();
  return NextResponse.json(
    { version, updatedAt: data.wedding?.updatedAt },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    }
  );
}
