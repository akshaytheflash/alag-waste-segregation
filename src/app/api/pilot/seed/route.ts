import { NextResponse } from "next/server";
import { seedTemplatePilot, getPilotStats } from "@/lib/pilotSeed";

export async function POST() {
  const r = seedTemplatePilot();
  return NextResponse.json({ ...r, stats: getPilotStats() });
}
