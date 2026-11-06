import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/pilotSeed";

export function GET() {
  return NextResponse.json({ data: getLeaderboard(), label: "Pilot-collected" });
}
