"use client";
import { useEffect, useState } from "react";

export default function Leaderboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((j) => {
        setData(j.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>RWA / Ward leaderboard</h1>
      <p className="muted">
        Ranked by % of bins segregated (photo-proven). Ward labels are <strong>Pilot-collected</strong> — no invented ward numbers. CPCB context is national; this leaderboard is local pilot evidence.
      </p>
      {loading ? (
        <p>Loading…</p>
      ) : data.length === 0 ? (
        <div className="card">
          <p>No leaderboard data yet. Seed the template pilot from <a href="/dashboard">/dashboard</a> or collect live inspections from <a href="/">Collector</a>.</p>
        </div>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr><th>#</th><th>RWA</th><th>Ward (pilot)</th><th>Households</th><th>Photos</th><th>Compliance</th><th>Wet kg</th></tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i}>
                  <td>{["🥇", "🥈", "🥉"][i] || i + 1}</td>
                  <td>{r.rwa}</td>
                  <td>{r.ward}</td>
                  <td>{r.households}</td>
                  <td>{r.inspections}</td>
                  <td><strong>{r.compliancePct}%</strong></td>
                  <td>{r.wetKg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="card">
        <h3>Why this matters</h3>
        <p style={{ fontSize: "0.9rem" }}>
          Mandated segregation has no per-household evidence — the collector is the only person who sees every bin daily. Alag converts that daily view into auditable counts that can be shown to RWAs, wards, and Swachh Bharat officers. Leaderboard + WhatsApp nudges create the compliance loop that moves Day-1 → Day-7.
        </p>
      </div>
    </div>
  );
}
