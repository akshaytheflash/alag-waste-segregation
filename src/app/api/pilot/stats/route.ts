import { NextResponse } from "next/server";
import { getPilotStats } from "@/lib/pilotSeed";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getPilotStats());
}
