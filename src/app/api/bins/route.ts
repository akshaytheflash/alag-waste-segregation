import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET() {
  const rows = db().prepare(`SELECT * FROM bins ORDER BY id DESC LIMIT 500`).all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  if (!b.household_name) return NextResponse.json({ error: "household_name required" }, { status: 400 });
  const info = db()
    .prepare(
      `INSERT INTO bins (household_name, house_no, street, pincode, rwa, ward_label, phone, language, lat, lng)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      String(b.household_name),
      String(b.house_no || ""),
      String(b.street || ""),
      String(b.pincode || ""),
      String(b.rwa || "Pilot RWA"),
      "Pilot-collected",
      String(b.phone || ""),
      String(b.language || "en"),
      b.lat != null ? Number(b.lat) : null,
      b.lng != null ? Number(b.lng) : null
    );
  const row = db().prepare(`SELECT * FROM bins WHERE id = ?`).get(Number(info.lastInsertRowid));
  return NextResponse.json(row, { status: 201 });
}
