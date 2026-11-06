import { NextRequest, NextResponse } from "next/server";

// Live Open-Meteo air quality — https://air-quality-api.open-meteo.com
export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat") || "28.6139";
  const lng = req.nextUrl.searchParams.get("lng") || "77.2090";
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm2_5,pm10`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Upstream ${res.status}`);
    const data = await res.json();
    const c = data?.current || {};
    return NextResponse.json({
      usAqi: c.us_aqi ?? null,
      pm25: c.pm2_5 ?? null,
      pm10: c.pm10 ?? null,
      time: c.time ?? null,
      source: "https://air-quality-api.open-meteo.com (Open-Meteo / CAMS)",
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Air quality service is unreachable. Retry.", detail: e?.message }, { status: 502 });
  }
}
