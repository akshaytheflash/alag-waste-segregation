import { NextRequest, NextResponse } from "next/server";
import { findLandfills } from "@/lib/landfills";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const lat = Number(p.get("lat") ?? 28.6139);
  const lng = Number(p.get("lng") ?? 77.209);
  const radius = Number(p.get("radius") ?? 25);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return NextResponse.json({ error: "lat must be between -90 and 90" }, { status: 400 });
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "lng must be between -180 and 180" }, { status: 400 });
  }
  const km = Math.max(2, Math.min(40, Number.isFinite(radius) ? radius : 25));

  try {
    const result = await findLandfills(lat, lng, km);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      {
        available: false,
        sites: [],
        center: { lat, lng },
        error: e?.message || "Landfill lookup failed",
        osmSearchUrl: `https://www.openstreetmap.org/#map=12/${lat}/${lng}`,
      },
      { status: 200 }
    );
  }
}
