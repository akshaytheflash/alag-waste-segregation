"use client";
import { useEffect, useState } from "react";
import { computeImpact, formulaLines, FACTORS } from "@/lib/impact";
import { useI18n } from "@/components/I18nProvider";
import type { MessageKey } from "@/lib/i18n";

type Day = {
  day: number;
  date: string;
  inspections: number;
  compliancePct: number;
  wetKg: number;
  dryKg: number;
  mixedKg: number;
};

type Stats = {
  isTemplate: boolean;
  seededAt: string | null;
  totalHouseholds: number;
  days: Day[];
  baseline: number;
  day7: number;
  liftPoints: number;
  wetDivertedKg: number;
  mixedKg: number;
};

const KG_HEAD_KEYS: MessageKey[] = [
  "dashboard.thDay",
  "dashboard.thBins",
  "dashboard.thWetKg",
  "dashboard.thDryKg",
  "dashboard.thMixedKg",
];

export default function Dashboard() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/pilot/stats");
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setStats(j);
    } catch (e: any) {
      setError(e?.message || t("dashboard.statsRouteError"));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function seed() {
    setSeeding(true);
    setError("");
    try {
      const r = await fetch("/api/pilot/seed", { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setStats(j.stats);
    } catch (e: any) {
      setError(e?.message || t("dashboard.seedFailed"));
    }
    setSeeding(false);
  }

  if (loading) {
    return (
      <section className="hero">
        <p className="label">{t("dashboard.kicker")}</p>
        <h1>{t("dashboard.loadingTitle")}</h1>
        <div className="empty" style={{ marginTop: 16 }}>
          <b>{t("dashboard.loadingLead")}</b> {t("dashboard.loadingBody")}
        </div>
      </section>
    );
  }

  if (!stats || !stats.days?.length) {
    return (
      <>
        <section className="hero">
          <p className="label">{t("dashboard.kicker")}</p>
          <h1>{t("dashboard.emptyTitle")}</h1>
          <p>{t("dashboard.emptyBody")}</p>
        </section>
        {error && (
          <div className="notice red">
            <span className="notice-title">{t("dashboard.errorTitle")}</span>
            {error}
          </div>
        )}
        <div className="empty">
          <b>{t("dashboard.twoWays")}</b>
          <div className="btn-row two" style={{ marginTop: 10 }}>
            <button className="btn btn-primary" type="button" onClick={seed} disabled={seeding}>
              {seeding ? t("dashboard.seedingRows") : t("dashboard.seedTemplate")}
            </button>
            <a className="btn btn-quiet" href="/">
              {t("dashboard.collectLive")}
            </a>
          </div>
        </div>
      </>
    );
  }

  const impact = computeImpact(stats.totalHouseholds, stats.day7, 7);
  const lines = formulaLines(stats.totalHouseholds, stats.day7, 7);
  const annual = computeImpact(1000, stats.day7, 7).annualPer1000Tonnes;
  const seededOn = stats.seededAt
    ? new Date(stats.seededAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  return (
    <>
      <section className="hero">
        <p className="label">{t("dashboard.kickerCount", { count: stats.totalHouseholds })}</p>
        <h1>{t("dashboard.title")}</h1>
        <p>{t("dashboard.intro")}</p>
        <div className="hero-meta">
          <span>
            {t("dashboard.register")}{" "}
            <b>{stats.isTemplate ? t("dashboard.registerTemplate") : t("dashboard.registerLive")}</b>
          </span>
          <span>
            {t("dashboard.rows")}{" "}
            <b>{stats.days.reduce((n, d) => n + d.inspections, 0).toLocaleString("en-IN")}</b>
          </span>
          <span>
            {t("dashboard.days")} <b>{stats.days.length}</b>
          </span>
        </div>
      </section>

      {stats.isTemplate && (
        <div className="notice" style={{ borderLeftWidth: 8 }}>
          <span className="notice-title">{t("dashboard.templateTitle")}</span>
          {seededOn
            ? t("dashboard.templateBodySeeded", { date: seededOn })
            : t("dashboard.templateBodyDemo")}
          <div className="btn-row two" style={{ marginTop: 10, maxWidth: 520 }}>
            <a className="btn btn-ink btn-sm" href="/">
              {t("dashboard.collectLivePlural")}
            </a>
            <button className="btn btn-quiet btn-sm" type="button" onClick={seed} disabled={seeding}>
              {seeding ? t("dashboard.reseeding") : t("dashboard.reseed")}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="notice red">
          <span className="notice-title">{t("dashboard.ledgerError")}</span>
          {error}
        </div>
      )}

      <section className="sheet">
        <div className="sheet-head">
          <h2>{t("dashboard.day1to7")}</h2>
          <span className={`tag ${stats.isTemplate ? "ochre" : "green"}`}>
            {stats.isTemplate ? t("dashboard.templateRows") : t("dashboard.photoRows")}
          </span>
        </div>

        <div className="readout">
          <div className="side">
            <span className="big num">
              {stats.baseline}
              <small>%</small>
            </span>
            <span className="caption">
              {t("dashboard.day1Baseline")}
              <br />
              {t("dashboard.binsPhotographed", {
                count: stats.days[0]?.inspections.toLocaleString("en-IN") ?? 0,
              })}
            </span>
          </div>
          <div className="mid" aria-hidden="true">
            {t("dashboard.sevenDays")}
          </div>
          <div className="side right">
            <span className="big num">
              {stats.day7}
              <small>%</small>
            </span>
            <span className="caption">
              {t("dashboard.day7Compliance")}
              <br />
              {t("dashboard.binsPhotographed", {
                count: stats.days[stats.days.length - 1]?.inspections.toLocaleString("en-IN") ?? 0,
              })}
            </span>
          </div>
        </div>
        <span className={`delta ${stats.liftPoints < 0 ? "ochre" : ""}`}>
          {stats.liftPoints >= 0 ? "+" : ""}
          {t("dashboard.points", { points: stats.liftPoints })}
        </span>
        <p className="source" style={{ marginTop: 8 }}>
          {t("dashboard.deltaNote")}
        </p>
      </section>

      <section className="sheet">
        <div className="sheet-head">
          <h2>{t("dashboard.complianceByDay")}</h2>
          <span className="sheet-meta">{t("dashboard.complianceFormula")}</span>
        </div>
        <div className="bar-scale" aria-hidden="true">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
        {stats.days.map((d) => (
          <div className="bar-row" key={d.day}>
            <div className="day">
              <b>{t("dashboard.dayN", { day: d.day })}</b>
              {d.date.slice(5)}
            </div>
            <div
              className="bar-track"
              role="img"
              aria-label={t("dashboard.barAria", { day: d.day, pct: d.compliancePct })}
            >
              <div
                className={`bar-fill ${d.compliancePct < 50 ? "red" : d.compliancePct < 70 ? "ochre" : ""}`}
                style={{ width: `${Math.max(0, Math.min(100, d.compliancePct))}%` }}
              />
            </div>
            <div className="pct num">{d.compliancePct}%</div>
          </div>
        ))}
        <p className="source" style={{ marginTop: 10 }}>
          {t("dashboard.barNote", { count: stats.days[0]?.inspections || 0 })}
        </p>

        <details className="kit" style={{ marginTop: 12 }}>
          <summary>
            <span>{t("dashboard.kgDetails")}</span>
            <span className="plus" aria-hidden="true">
              +
            </span>
          </summary>
          <div className="kit-body" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <thead>
                <tr>
                  {KG_HEAD_KEYS.map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "6px 8px",
                        borderBottom: "2px solid var(--ink)",
                        fontWeight: 600,
                      }}
                    >
                      {t(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.days.map((d) => (
                  <tr key={d.day}>
                    <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--line)" }}>{d.day}</td>
                    <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--line)" }}>{d.inspections}</td>
                    <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--line)" }}>{d.wetKg}</td>
                    <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--line)" }}>{d.dryKg}</td>
                    <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--line)" }}>{d.mixedKg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="sheet">
        <div className="sheet-head">
          <h2>{t("dashboard.divertedTitle")}</h2>
          <span className="tag ochre">{t("dashboard.estimateNotWeighbridge")}</span>
        </div>
        <p className="sheet-lede">{t("dashboard.divertedIntro")}</p>

        <div className="formula">
          {lines.map((l) => (
            <div className="formula-line" key={l.expressionKey}>
              <span className="expr">{t(l.expressionKey, l.expressionVars)}</span>
              <span className="res num">{t(l.resultKey, l.resultVars)}</span>
              <span className="src">{l.sourceKey ? t(l.sourceKey) : l.source}</span>
            </div>
          ))}
          <div className="formula-total">
            <div>
              <span className="big num">
                {impact.divertedKg.toLocaleString("en-IN")}
                <small> kg</small>
              </span>
              <span className="caption">
                {t("dashboard.wetDiverted")}
                <br />
                {t("dashboard.atSegregation", { pct: stats.day7 })}
              </span>
            </div>
            <span className="tag green">{t("dashboard.estimate")}</span>
          </div>
        </div>

        <div className="context-line" style={{ marginTop: 12 }}>
          <span className="k">{t("dashboard.annualised", { pct: stats.day7 })}</span>
          <span className="v num">
            {t("dashboard.annualValue", { tonnes: annual })}
            <small>{t("dashboard.sameFactors")}</small>
          </span>
        </div>
        <div className="context-line">
          <span className="k">{t("dashboard.measured")}</span>
          <span className="v num">
            {t("dashboard.measuredValue", { kg: stats.wetDivertedKg.toLocaleString("en-IN") })}
            <small>{t("dashboard.measuredNote")}</small>
          </span>
        </div>
        <div className="context-line">
          <span className="k">{t("dashboard.stillMixed")}</span>
          <span className="v num">
            {t("dashboard.measuredValue", { kg: stats.mixedKg.toLocaleString("en-IN") })}
            <small>{t("dashboard.sevenDays")}</small>
          </span>
        </div>

        <p className="source" style={{ marginTop: 10 }}>
          {t("dashboard.factorsNote", {
            size: FACTORS.householdSize,
            householdSource: FACTORS.householdSource,
            perCapita: FACTORS.perCapitaKgDay,
            perCapitaSource: FACTORS.perCapitaSource,
            compositionSource: FACTORS.compositionSource,
          })}
        </p>
      </section>

      <section className="sheet">
        <div className="sheet-head">
          <h2>{t("dashboard.problemTitle")}</h2>
          <span className="sheet-meta">{t("dashboard.problemMeta")}</span>
        </div>
        <div className="notice" style={{ borderLeftWidth: 8 }}>
          <span className="notice-title">{t("dashboard.problemNoticeTitle")}</span>
          {t("dashboard.problemNoticeBody")}
        </div>
        <p className="source">{t("dashboard.problemNote")}</p>
      </section>

      <section className="sheet">
        <div className="sheet-head">
          <h2>{t("dashboard.loopTitle")}</h2>
          <span className="sheet-meta">{t("dashboard.loopMeta")}</span>
        </div>
        <ol className="steps">
          <li>
            <div>
              <b>{t("dashboard.step1Title")}</b>
              <span>{t("dashboard.step1Body")}</span>
            </div>
          </li>
          <li>
            <div>
              <b>{t("dashboard.step2Title")}</b>
              <span>{t("dashboard.step2Body")}</span>
            </div>
          </li>
          <li>
            <div>
              <b>{t("dashboard.step3Title")}</b>
              <span>{t("dashboard.step3Body")}</span>
            </div>
          </li>
          <li>
            <div>
              <b>{t("dashboard.step4Title")}</b>
              <span>{t("dashboard.step4Body")}</span>
            </div>
          </li>
        </ol>
        <div className="btn-row two" style={{ marginTop: 14 }}>
          <a className="btn btn-primary" href="/">
            {t("dashboard.openField")}
          </a>
          <a className="btn btn-quiet" href="/leaderboard">
            {t("dashboard.seeWard")}
          </a>
        </div>
      </section>
    </>
  );
}
