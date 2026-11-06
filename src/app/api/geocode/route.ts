import { NextRequest, NextResponse } from "next/server";

// Live Nominatim geocoding — https://nominatim.openstreetmap.org/search
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) return NextResponse.json({ error: "Pass ?q=address text" }, { status: 400 });
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=3&addressdetails=1&countrycodes=in`;
    const res = await fetch(url, { headers: { "User-Agent": "Alag-Pilot/1.0 (collector PWA)" } });
    if (!res.ok) throw new Error(`Upstream ${res.status}`);
    const data = await res.json();
    return NextResponse.json(
      data.map((r: any) => ({
        name: r.display_name,
        lat: Number(r.lat),
        lng: Number(r.lon),
        type: r.type,
        address: r.address,
      }))
    );
  } catch (e: any) {
    return NextResponse.json({ error: "Geocoding service unreachable. Retry, or enter coordinates manually.", detail: e?.message }, { status: 502 });
  }
}
