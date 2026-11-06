// Template pilot seed — labeled pilot-collected, 200 households x 7 days.
// This is NOT government data. It models a realistic before/after flow so the
// dashboard can be demoed end-to-end. Replace with live pilot data in production.
import { db } from "./db";

const RWAS = ["Green Valley RWA", "Sunrise Enclave RWA", "Lakeview RWA", "MG Colony RWA", "Park Residency RWA"];
const HOUSES = ["A", "B", "C", "D", "E"];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

export function seedTemplatePilot() {
  const conn = db();
  const wipe = conn.transaction(() => {
    conn.exec(`DELETE FROM inspections; DELETE FROM bins; DELETE FROM pilot_meta;`);
  });
  wipe();

  const today = new Date();
  const dates: string[] = [];
  for (let d = 6; d >= 0; d--) {
    const dt = new Date(today);
    dt.setDate(today.getDate() - d);
    dates.push(dt.toISOString().slice(0, 10));
  }

  const rnd = seededRandom(42);
  const insertBin = conn.prepare(
    `INSERT INTO bins (household_name, house_no, street, pincode, rwa, ward_label, phone, language)
     VALUES (?, ?, ?, ?, ?, 'Pilot-collected', ?, ?)`
  );
  const insertInsp = conn.prepare(
    `INSERT INTO inspections (bin_id, date, day_offset, wet_kg, dry_kg, mixed_kg, hazardous_kg, classification, compliance, photo_hash, source, llm_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const bulk = conn.transaction(() => {
    for (let h = 0; h < 200; h++) {
      const rwa = RWAS[h % RWAS.length];
      const houseNo = `${HOUSES[Math.floor(rnd() * 5)]}-${100 + h}`;
      const name = `${rwa.split(" ")[0]} Household ${h + 101}`;
      const phone = `9${800000000 + h}`;
      const lang = h % 3 === 0 ? "hi" : "en";
      const pincode = ["110001", "411001", "695001", "560001"][h % 4];
      const info = insertBin.run(name, houseNo, `Street ${1 + (h % 12)}`, pincode, rwa, phone, lang);
      const binId = Number(info.lastInsertRowid);
      // Day-1 baseline: ~30% compliant. Day-7: ~78% compliant (nudge effect).
      for (let day = 0; day < 7; day++) {
        const complianceRate = 0.3 + (day / 6) * 0.48; // 30% -> 78%
        const compliant = rnd() < complianceRate;
        let classification: string;
        let wet = 0, dry = 0, mixed = 0, haz = 0;
        if (compliant) {
          classification = rnd() < 0.55 ? "wet" : "dry";
          wet = rnd() * 1.6 + 0.4;
          dry = rnd() * 1.1 + 0.2;
        } else {
          classification = "mixed";
          mixed = rnd() * 1.8 + 0.6;
          wet = rnd() * 0.6;
          dry = rnd() * 0.4;
        }
        if (rnd() < 0.02) {
          classification = "hazardous";
          haz = 0.15 + rnd() * 0.25;
        }
        insertInsp.run(
          binId,
          dates[day],
          day,
          Number(wet.toFixed(2)),
          Number(dry.toFixed(2)),
          Number(mixed.toFixed(2)),
          Number(haz.toFixed(2)),
          classification,
          compliant ? 1 : 0,
          `seed-${binId}-${day}`,
          "template",
          compliant ? "Segregated correctly (template)" : "Mixed bin — WhatsApp nudge sent (template)"
        );
      }
    }
    conn.prepare(`INSERT INTO pilot_meta (key, value) VALUES (?, ?)`).run("is_template", "1");
    conn.prepare(`INSERT INTO pilot_meta (key, value) VALUES (?, ?)`).run("households", "200");
    conn.prepare(`INSERT INTO pilot_meta (key, value) VALUES (?, ?)`).run("seeded_at", new Date().toISOString());
  });
  bulk();
  return { households: 200, days: 7 };
}

export function getPilotStats() {
  const conn = db();
  const isTemplate = conn.prepare(`SELECT value FROM pilot_meta WHERE key='is_template'`).get() as any;
  const totalBins = (conn.prepare(`SELECT COUNT(*) as c FROM bins`).get() as any).c as number;

  const byDay = conn
    .prepare(
      `SELECT day_offset, date, COUNT(*) as n,
              SUM(compliance) as compliant,
              SUM(wet_kg) as wet,
              SUM(dry_kg) as dry,
              SUM(mixed_kg) as mixed
       FROM inspections GROUP BY day_offset, date ORDER BY day_offset`
    )
    .all() as any[];

  const days = byDay.map((r) => ({
    day: r.day_offset + 1,
    date: r.date,
    inspections: Number(r.n),
    compliancePct: r.n ? Math.round((Number(r.compliant) / Number(r.n)) * 1000) / 10 : 0,
    wetKg: Math.round(Number(r.wet || 0) * 10) / 10,
    dryKg: Math.round(Number(r.dry || 0) * 10) / 10,
    mixedKg: Math.round(Number(r.mixed || 0) * 10) / 10,
  }));

  const day1 = days[0]?.compliancePct ?? 0;
  const day7 = days[days.length - 1]?.compliancePct ?? 0;
  // kg wet diverted: sum of wet_kg on compliant (non-mixed) inspections across week
  const wetTotal = (conn.prepare(`SELECT COALESCE(SUM(wet_kg),0) as s FROM inspections WHERE classification != 'mixed'`).get() as any).s as number;
  const mixedTotal = (conn.prepare(`SELECT COALESCE(SUM(mixed_kg),0) as s FROM inspections`).get() as any).s as number;

  return {
    isTemplate: isTemplate?.value === "1",
    totalHouseholds: totalBins,
    days,
    baseline: day1,
    day7,
    liftPoints: Math.round((day7 - day1) * 10) / 10,
    wetDivertedKg: Math.round(Number(wetTotal) * 10) / 10,
    mixedKg: Math.round(Number(mixedTotal) * 10) / 10,
  };
}

export function getLeaderboard() {
  const conn = db();
  return conn
    .prepare(
      `SELECT b.rwa as rwa, b.ward_label as ward, COUNT(DISTINCT b.id) as households,
              COUNT(i.id) as inspections,
              SUM(i.compliance) as compliant,
              COALESCE(SUM(i.wet_kg),0) as wet_kg
       FROM bins b
       LEFT JOIN inspections i ON i.bin_id = b.id
       GROUP BY b.rwa, b.ward_label
       ORDER BY (CASE WHEN COUNT(i.id)>0 THEN 1.0*SUM(i.compliance)/COUNT(i.id) ELSE 0 END) DESC`
    )
    .all()
    .map((r: any) => ({
      rwa: r.rwa,
      ward: r.ward,
      households: Number(r.households),
      inspections: Number(r.inspections),
      compliancePct: r.inspections ? Math.round((100 * Number(r.compliant)) / Number(r.inspections) * 10) / 10 : 0,
      wetKg: Math.round(Number(r.wet_kg) * 10) / 10,
    }));
}
