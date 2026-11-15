"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

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
  const { t } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [template, setTemplate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

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
        setFailed(true);
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
        <p className="label">{t("leaderboard.kicker")}</p>
        <h1>{t("leaderboard.title")}</h1>
        <p>{t("leaderboard.intro")}</p>
        <div className="hero-meta">
          <span>
            {t("leaderboard.rows")} <b>{rows.length}</b>
          </span>
          <span>
            {t("leaderboard.source")}{" "}
            <b>{template ? t("leaderboard.templateSource") : t("leaderboard.liveRegister")}</b>
          </span>
          <span>
            {t("leaderboard.wardLabels")} <b>{t("leaderboard.pilotCollected")}</b>
          </span>
        </div>
      </section>

      {template && (
        <div className="notice">
          <span className="notice-title">{t("leaderboard.templateTitle")}</span>
          {t("leaderboard.templateBody")}
        </div>
      )}

      {failed && (
        <div className="notice red">
          <span className="notice-title">{t("leaderboard.errorTitle")}</span>
          {t("leaderboard.errorBody")}
        </div>
      )}

      <section className="sheet">
        <div className="sheet-head">
          <h2>{t("leaderboard.registerTitle")}</h2>
          <span className="sheet-meta">{t("leaderboard.formula")}</span>
        </div>

        {loading ? (
          <div className="empty">
            <b>{t("leaderboard.loadingTitle")}</b>
            {t("leaderboard.loadingBody")}
          </div>
        ) : rows.length === 0 ? (
          <div className="empty">
            <b>{t("leaderboard.emptyTitle")}</b>
            {t("leaderboard.emptyBody")}
            <div className="btn-row two" style={{ marginTop: 10 }}>
              <a className="btn btn-primary" href="/dashboard">
                {t("leaderboard.openLedger")}
              </a>
              <a className="btn btn-quiet" href="/">
                {t("leaderboard.collect")}
              </a>
            </div>
          </div>
        ) : (
          <div className="ledger">
            <div className="ledger-head">
              <span>{t("leaderboard.rankRwa")}</span>
              <span>{t("leaderboard.compliance")}</span>
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
                        {t("leaderboard.rowMeta", {
                          ward: r.ward,
                          households: r.households,
                          inspections: r.inspections,
                          wetKg: r.wetKg,
                        })}
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
                    <small>
                      {r.inspections
                        ? t("leaderboard.volume", {
                            pct: Math.round((r.inspections / max) * 100),
                          })
                        : t("leaderboard.noPhotos")}
                    </small>
                  </div>
                </div>
              </div>
            ))}
            <div className="ledger-foot">{t("leaderboard.foot", { count: rows.length })}</div>
          </div>
        )}
      </section>

      <section className="sheet">
        <div className="sheet-head">
          <h2>{t("leaderboard.measuresTitle")}</h2>
          <span className="sheet-meta">{t("leaderboard.measuresMeta")}</span>
        </div>
        <div className="grid-2">
          <div>
            <h3 style={{ marginBottom: 6 }}>{t("leaderboard.measuresH3")}</h3>
            <p className="small" style={{ color: "var(--ink-2)" }}>
              {t("leaderboard.measuresBody")}
            </p>
          </div>
          <div>
            <h3 style={{ marginBottom: 6 }}>{t("leaderboard.notMeasuresH3")}</h3>
            <p className="small" style={{ color: "var(--ink-2)" }}>
              {t("leaderboard.notMeasuresBody")}
            </p>
          </div>
        </div>
        <div className="notice" style={{ marginTop: 14 }}>
          <span className="notice-title">{t("leaderboard.whyTitle")}</span>
          {t("leaderboard.whyBody")}
        </div>
      </section>
    </>
  );
}
