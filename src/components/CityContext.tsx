"use client";

import { useI18n } from "@/components/I18nProvider";

type Rank = {
  city: string;
  state: string;
  rank: number;
  of: number;
  year: string;
  source: string;
  sourceUrl: string;
  live: boolean;
};

type Swm = {
  city: string;
  generatedTpd: number | null;
  collectedTpd: number | null;
  processedTpd: number | null;
  year: string;
  source: string;
  sourceUrl: string;
};

export type CityData = {
  ok: boolean;
  pincode: string;
  district: string;
  state: string;
  city: string;
  rank: Rank | null;
  rankNote: string;
  rankAlternatives: Rank[];
  solidWaste: Swm | null;
  solidWasteNote: string;
  feeds: {
    rankLive: boolean;
    rankFetchedAt: string;
    rankError: string | null;
    rankSourceUrl: string;
    swmLive: boolean;
    swmFetchedAt: string;
    swmError: string | null;
    swmSourceUrl: string;
  };
  national: {
    generatedTpd: number;
    processedPct: number;
    label: string;
    source: string;
    sourceUrl: string;
  };
  cached?: boolean;
};

function fmt(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-IN");
}

export default function CityContext({
  data,
  loading,
  error,
  pincode,
}: {
  data: CityData | null;
  loading: boolean;
  error: string;
  pincode: string;
}) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="stack" aria-live="polite">
        <p className="small muted">{t("city.resolving", { pin: pincode })}</p>
        <div className="context-line">
          <span className="k">{t("city.rank")}</span>
          <span className="v">{t("city.checking")}</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="notice red">
        <span className="notice-title">{t("city.unavailable")}</span>
        {error || t("city.pinUnresolved")} {t("city.noGuess")}
      </div>
    );
  }

  const { rank, solidWaste, feeds, national } = data;

  return (
    <div>
      <div className="rank-block">
        {rank ? (
          <>
            <span className="rank-num num">{rank.rank}</span>
            <span className="rank-copy">
              <b>{t("city.ofCities", { of: rank.of, year: rank.year })}</b>
              {rank.city}, {rank.state}
            </span>
          </>
        ) : (
          <span className="rank-num none">{t("city.notPublished")}</span>
        )}
      </div>

      {rank ? (
        <p className="source">
          {rank.source}.{" "}
          <a href={rank.sourceUrl} target="_blank" rel="noreferrer">
            {t("common.openSource")}
          </a>
          {rank.live
            ? ` · ${t("city.liveFetched", {
                date: new Date(feeds.rankFetchedAt).toLocaleDateString("en-IN"),
              })}`
            : ` · ${t("city.verifiedExtract")}`}
        </p>
      ) : (
        <p className="small" style={{ color: "var(--ink-2)" }}>
          {/delhi/i.test(data.state)
            ? t("city.rankNoteDelhi", { district: data.district })
            : t("city.rankNoteNone", { district: data.district })}
        </p>
      )}

      {!rank && data.rankAlternatives.length > 0 && (
        <div className="row" style={{ gap: 6, marginTop: 8 }}>
          {data.rankAlternatives.map((r) => (
            <span key={r.city} className="tag ink">
              {r.city} {r.rank}
            </span>
          ))}
        </div>
      )}

      {feeds.rankError && (
        <div className="notice" style={{ marginTop: 12 }}>
          <span className="notice-title">{t("common.sourceNote")}</span>
          {feeds.rankError}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <div className="context-line">
          <span className="k">
            {t("city.solidWasteYear", { year: solidWaste?.year || "2017-18" })}
          </span>
          <span className="v">
            {solidWaste?.generatedTpd != null
              ? `${fmt(solidWaste.generatedTpd)} t/day`
              : t("common.notPublished")}
            <small>
              {solidWaste?.generatedTpd != null ? t("city.generated") : t("city.forThisCity")}
            </small>
          </span>
        </div>
        <div className="context-line">
          <span className="k">{t("city.collected")}</span>
          <span className="v">
            {solidWaste?.collectedTpd != null ? `${fmt(solidWaste.collectedTpd)} t/day` : "—"}
            <small>
              {solidWaste?.collectedTpd != null ? t("city.ulbReturn") : t("common.noRow")}
            </small>
          </span>
        </div>
        <div className="context-line">
          <span className="k">{t("city.processed")}</span>
          <span className="v">
            {solidWaste?.processedTpd != null ? `${fmt(solidWaste.processedTpd)} t/day` : "—"}
            <small>
              {solidWaste?.processedTpd != null ? t("city.ulbReturn") : t("common.noRow")}
            </small>
          </span>
        </div>
        <p className="source" style={{ marginTop: 8 }}>
          {solidWaste ? (
            <>
              {solidWaste.source}.{" "}
              <a href={solidWaste.sourceUrl} target="_blank" rel="noreferrer">
                {t("common.openRow")}
              </a>
            </>
          ) : (
            t("city.noSolidWasteRow", { district: data.district })
          )}
        </p>
      </div>

      <div className="notice" style={{ marginTop: 14 }}>
        <span className="notice-title">{t("city.nationalTitle")}</span>
        {national.label}. {national.source}.
      </div>

      <p className="source" style={{ marginTop: 8 }}>
        {t("city.footnote", {
          pin: data.pincode,
          district: data.district,
          state: data.state,
        })}
      </p>
    </div>
  );
}
