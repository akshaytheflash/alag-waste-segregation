"use client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/pilot/stats");
      setStats(await r.json());
    } catch {}
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function seed() {
    setSeeding(true);
    const r = await fetch("/api/pilot/seed", { method: "POST" });
    setStats((await r.json()).stats);
    setSeeding(false);
  }

  if (loading) return <p>Loading pilot data…</p>;
  if (!stats || !stats.days?.length) {
    return (
      <div>
        <h1>7-day pilot dashboard</h1>
        <p className="muted">No pilot data yet. Load the template pilot (200 households × 7 days, clearly labeled) or add live inspections from the Collector tab.</p>
        <button className="btn btn-primary" onClick={seed} disabled={seeding}>
          {seeding ? "Seeding…" : "Seed template pilot (200 households × 7 days)"}
        </button>
      </div>
    );
  }

  const maxWet = Math.max(...stats.days.map((d: any) => Math.max(d.wetKg, d.mixedKg)));
  return (
    <div>
      <h1>7-day pilot dashboard</h1>
      <p className="muted">Before/after from collector photos — ~200 households. Ward data is <em>Pilot-collected</em>.</p>

      {stats.isTemplate && (
        <div className="card" style={{ borderColor: "#f59e0b", background: "#fffbeb" }}>
          <strong>⚠️ TEMPLATE PILOT DATA</strong>
          <p className="muted">
            This 7-day flow (200 households) is seeded template data to demonstrate the dashboard end-to-end (Day-1 baseline vs Day-7). It is <strong>not</strong> government data. Real deployment: use the Collector tab live, then clear/replace this data.
          </p>
          <div className="row">
            <button className="btn btn-primary" onClick={seed} disabled={seeding}>Re-seed template</button>
            <a className="btn btn-ghost" href="/">Replace with live pilot →</a>
          </div>
        </div>
      )}

      <div className="grid3" style={{ marginTop: 12 }}>
        <div className="stat"><b>{stats.baseline}%</b><div className="muted">Day-1 baseline</div></div>
        <div className="stat"><b>{stats.day7}%</b><div className="muted">Day-7 compliance</div></div>
        <div className="stat"><b>+{stats.liftPoints} pts</b><div className="muted">Lift (nudges)</div></div>
        <div className="stat"><b>{stats.wetDivertedKg} kg</b><div className="muted">Wet waste diverted (7d)</div></div>
        <div className="stat"><b>{stats.mixedKg} kg</b><div className="muted">Still mixed (7d)</div></div>
        <div className="stat"><b>{stats.totalHouseholds}</b><div className="muted">Households</div></div>
      </div>

      <div className="card">
        <h3>Compliance by day (wet/dry segregated)</h3>
        {stats.days.map((d: any) => (
          <div key={d.day} style={{ marginBottom: 10 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.85rem" }}>Day {d.day} • {d.date}</span>
              <strong>{d.compliancePct}%</strong>
            </div>
            <div className="bar-wrap"><div className="bar-fill" style={{ width: `${Math.min(100, d.compliancePct)}%` }} /></div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Wet vs Mixed kg by day</h3>
        <table className="table">
          <thead><tr><th>Day</th><th>Wet kg</th><th>Dry kg</th><th>Mixed kg</th></tr></thead>
          <tbody>
            {stats.days.map((d: any) => (
              <tr key={d.day}><td>{d.day}</td><td>{d.wetKg}</td><td>{d.dryKg}</td><td>{d.mixedKg}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="muted">Scale: mixed bar relative to daily wet max {maxWet} kg. Wet diverted = kg kept out of landfill because bins were segregated.</p>
      </div>

      <div className="card">
        <h3>How to run a real pilot</h3>
        <ol style={{ fontSize: "0.9rem", lineHeight: 1.6, paddingLeft: 18 }}>
          <li>Onboard 200 households (Collector tab → Add household, capture PIN live via India Post).</li>
          <li>Collector photographs every bin daily for 7 days (offline queue syncs when back online).</li>
          <li>Each photo is classified by BharatCode vision (2s→4s→8s backoff, deterministic fallback) and confirmed by the collector.</li>
          <li>Non-compliant bins trigger a WhatsApp nudge deep link (wa.me) in Hindi/English — collector taps Send.</li>
          <li>Day-1 baseline vs Day-7 on this dashboard = before/after proof. RWA leaderboard on <a href="/leaderboard">/leaderboard</a>.</li>
        </ol>
        <a className="btn btn-primary" href="/">→ Start live pilot collection</a>
      </div>
    </div>
  );
}
