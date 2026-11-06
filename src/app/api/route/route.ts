import { NextRequest, NextResponse } from "next/server";

// Live OSRM route — https://router.project-osrm.org/route/v1/driving/
// Real distance/duration for collection routes. Never fabricated.
export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams;
  const fromLng = s.get("fromLng"),
    fromLat = s.get("fromLat"),
    toLng = s.get("toLng"),
    toLat = s.get("toLat");
  if (!fromLng || !fromLat || !toLng || !toLat) {
    return NextResponse.json({ error: "Pass fromLng,fromLat,toLng,toLat" }, { status: 400 });
  }
  const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Upstream ${res.status}`);
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) return NextResponse.json({ error: "No route found between these points.", osrmCode: data?.code }, { status: 404 });
    return NextResponse.json({
      distanceM: Math.round(route.distance),
      durationS: Math.round(route.duration),
      distanceKm: Math.round(route.distance / 100) / 10,
      durationMin: Math.round(route.duration / 60),
      geometry: route.geometry,
      source: "https://router.project-osrm.org (OSRM driving profile)",
    });
  } catch (e: any) {
    return NextResponse.json({ error: "OSRM routing is unreachable. Retry — distances are never estimated locally.", detail: e?.message }, { status: 502 });
  }
}
