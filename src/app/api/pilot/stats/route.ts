import { NextResponse } from "next/server";
import { getPilotStats } from "@/lib/pilotSeed";

export function GET() {
  return NextResponse.json(getPilotStats());
}
