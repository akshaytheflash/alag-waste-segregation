import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET() {
  const rows = db()
    .prepare(
      `SELECT i.*, b.household_name, b.rwa FROM inspections i JOIN bins b ON b.id = i.bin_id
       ORDER BY i.id DESC LIMIT 500`
    )
    .all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  if (!b.bin_id) return NextResponse.json({ error: "bin_id required" }, { status: 400 });
  const compliance = b.compliance != null ? Number(b.compliance) : b.classification && b.classification !== "mixed" ? 1 : 0;
  const info = db()
    .prepare(
      `INSERT INTO inspections (bin_id, date, day_offset, wet_kg, dry_kg, mixed_kg, hazardous_kg, classification, compliance, photo_hash, source, llm_note, kabadi_requested)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      Number(b.bin_id),
      String(b.date || new Date().toISOString().slice(0, 10)),
      Number(b.day_offset || 0),
      Number(b.wet_kg || 0),
      Number(b.dry_kg || 0),
      Number(b.mixed_kg || 0),
      Number(b.hazardous_kg || 0),
      String(b.classification || "mixed"),
      compliance,
      String(b.photo_hash || ""),
      String(b.source || "manual"),
      String(b.llm_note || ""),
      Number(b.kabadi_requested || 0)
    );
  const row = db().prepare(`SELECT * FROM inspections WHERE id = ?`).get(Number(info.lastInsertRowid));
  return NextResponse.json(row, { status: 201 });
}
