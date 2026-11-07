import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/pilotSeed";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ data: getLeaderboard(), label: "Pilot-collected" });
}
