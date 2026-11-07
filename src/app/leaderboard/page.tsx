"use client";
import { useEffect, useState } from "react";

type Row = {
  rwa: string;
  ward: string;
  households: number;
  inspections: number;
  compliancePct: number;
  wetKg: number;
};

function tier(pct: number) {
  if (pct >= 75) return "green";
  if (pct >= 50) return "ochre";
  return "red";
}

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [template, setTemplate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/leaderboard").then((r) => r.json()),
      fetch("/api/pilot/stats").then((r) => r.json()).catch(() => null),
    ])
      .then(([lb, stats]) => {
        if (cancelled) return;
        setRows(Array.isArray(lb?.data) ? lb.data : []);
        setTemplate(Boolean(stats?.isTemplate));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("The ward register could not be read.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const max = Math.max(1, ...rows.map((r) => r.inspections));

  return (
    <>
      <section className="hero">
        <p className="label">Ward register · ranked by photo-proven compliance</p>
        <h1>Who is actually separating.</h1>
        <p>
          Ranked by the share of photographed bins recorded as wet or dry. Not a citizen survey, not a self-report: the collector
          stands in front of the bin.
        </p>
        <div className="hero-meta">
          <span>
            Rows: <b>{rows.length}</b>
          </span>
          <span>
            Source: <b>{template ? "template pilot" : "live register"}</b>
          </span>
          <span>
            Ward labels: <b>pilot-collected</b>
          </span>
        </div>
      </section>

      {template && (
        <div className="notice">
          <span className="notice-title">These ranks come from the seeded template pilot.</span>
          The RWA names are demonstration names, not real associations, and the ward column says pilot-collected because no municipal
          ward number was supplied. Replace the seed with live inspections before showing this to a ward officer.
        </div>
      )}

      {error && (
        <div className="notice red">
          <span className="notice-title">Register unavailable</span>
          {error}
        </div>
      )}

      <section className="sheet">
        <div className="sheet-head">
          <h2>The register</h2>
          <span className="sheet-meta">Wet or dry ÷ all photos</span>
        </div>

        {loading ? (
          <div className="empty">
            <b>Reading the ward register…</b>
            Ranking the photo rows by compliance.
          </div>
        ) : rows.length === 0 ? (
          <div className="empty">
            <b>No RWA rows yet.</b>
            Seed the template pilot on the <a href="/dashboard">pilot ledger</a>, or collect live inspections in the{" "}
            <a href="/">field tool</a>. The register fills itself from the inspection table; nothing is typed in by hand.
            <div className="btn-row two" style={{ marginTop: 10 }}>
              <a className="btn btn-primary" href="/dashboard">
                Open the pilot ledger
              </a>
              <a className="btn btn-quiet" href="/">
                Collect an inspection
              </a>
            </div>
          </div>
        ) : (
          <div className="ledger">
            <div className="ledger-head">
              <span>Rank / RWA</span>
              <span>Compliance</span>
            </div>
            {rows.map((r, i) => (
              <div className="ledger-row" key={`${r.rwa}-${i}`}>
                <span className={`rail ${tier(r.compliancePct)}`} aria-hidden="true" />
                <div className="cell">
                  <div className="row" style={{ gap: 10, alignItems: "baseline", flexWrap: "nowrap" }}>
                    <span
                      className="num"
                      style={{
                        fontSize: "1.7rem",
                        fontWeight: 600,
                        lineHeight: 0.9,
                        letterSpacing: "-0.04em",
                        minWidth: 34,
                        color: i === 0 ? "var(--green)" : "var(--ink)",
                      }}
                    >
                      {i + 1}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className="house">{r.rwa}</div>
                      <div className="meta">
                        Ward {r.ward} · {r.households} households · {r.inspections} photos · {r.wetKg} kg wet
                      </div>
                      <div className="bar-track" style={{ marginTop: 6, maxWidth: 260 }}>
                        <div
                          className={`bar-fill ${tier(r.compliancePct)}`}
                          style={{ width: `${Math.max(0, Math.min(100, r.compliancePct))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="cell right">
                  <div className="amount num" style={{ fontSize: "1.25rem" }}>
                    {r.compliancePct}%
                    <small>{r.inspections ? `${Math.round((r.inspections / max) * 100)}% of top volume` : "no photos"}</small>
                  </div>
                </div>
              </div>
            ))}
            <div className="ledger-foot">
              {rows.length} RWA rows. The rail turns ochre below 75% and red below 50%. A rank is only comparable within this pilot;
              household counts differ.
            </div>
          </div>
        )}
      </section>

      <section className="sheet">
        <div className="sheet-head">
          <h2>What the rank measures</h2>
          <span className="sheet-meta">And what it does not</span>
        </div>
        <div className="grid-2">
          <div>
            <h3 style={{ marginBottom: 6 }}>It measures</h3>
            <p className="small" style={{ color: "var(--ink-2)" }}>
              The share of bins in this RWA that a collector photographed and recorded as wet or dry. Mixed and hazardous bins count
              against. The denominator is every photo in the register, so an RWA cannot improve by skipping bad bins.
            </p>
          </div>
          <div>
            <h3 style={{ marginBottom: 6 }}>It does not measure</h3>
            <p className="small" style={{ color: "var(--ink-2)" }}>
              Cleanliness of the street, the ward&apos;s official Swachh Survekshan score, or whether the waste was processed after
              pickup. Ward labels are pilot-collected; no municipal ward number is invented. A high rank is evidence of separation at
              the bin, nothing more.
            </p>
          </div>
        </div>
        <div className="notice" style={{ marginTop: 14 }}>
          <span className="notice-title">Why the collector is the right sensor</span>
          The collector is the only person who sees every household&apos;s bin every day. A citizen report samples the angry; a
          city dashboard samples the aggregate. The photo register samples the actual bin, household by household.
        </div>
      </section>
    </>
  );
}
