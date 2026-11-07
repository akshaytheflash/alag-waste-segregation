"use client";

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
  if (loading) {
    return (
      <div className="stack" aria-live="polite">
        <p className="small muted">Resolving PIN {pincode} through India Post, then checking the Swachh Survekshan register…</p>
        <div className="context-line">
          <span className="k">City rank</span>
          <span className="v">Checking</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="notice red">
        <span className="notice-title">City context unavailable</span>
        {error || "The PIN could not be resolved."} No rank is shown rather than a guessed one.
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
              <b>
                of {rank.of} cities, {rank.year}
              </b>
              {rank.city}, {rank.state}
            </span>
          </>
        ) : (
          <span className="rank-num none">Not published for this city</span>
        )}
      </div>

      {rank ? (
        <p className="source">
          {rank.source}.{" "}
          <a href={rank.sourceUrl} target="_blank" rel="noreferrer">
            Open the source
          </a>
          {rank.live ? ` · live row fetched ${new Date(feeds.rankFetchedAt).toLocaleDateString("en-IN")}` : " · verified extract"}
        </p>
      ) : (
        <p className="small" style={{ color: "var(--ink-2)" }}>
          {data.rankNote}
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
          <span className="notice-title">Source note</span>
          {feeds.rankError}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <div className="context-line">
          <span className="k">City solid waste, {solidWaste?.year || "2017-18"}</span>
          <span className="v">
            {solidWaste?.generatedTpd != null ? `${fmt(solidWaste.generatedTpd)} t/day` : "Not published"}
            <small>{solidWaste?.generatedTpd != null ? "generated" : "for this city"}</small>
          </span>
        </div>
        <div className="context-line">
          <span className="k">Collected by the ULB</span>
          <span className="v">
            {solidWaste?.collectedTpd != null ? `${fmt(solidWaste.collectedTpd)} t/day` : "—"}
            <small>{solidWaste?.collectedTpd != null ? "ULB return" : "no row"}</small>
          </span>
        </div>
        <div className="context-line">
          <span className="k">Processed or recycled</span>
          <span className="v">
            {solidWaste?.processedTpd != null ? `${fmt(solidWaste.processedTpd)} t/day` : "—"}
            <small>{solidWaste?.processedTpd != null ? "ULB return" : "no row"}</small>
          </span>
        </div>
        <p className="source" style={{ marginTop: 8 }}>
          {solidWaste ? (
            <>
              {solidWaste.source}.{" "}
              <a href={solidWaste.sourceUrl} target="_blank" rel="noreferrer">
                Open the row
              </a>
            </>
          ) : (
            data.solidWasteNote
          )}
        </p>
      </div>

      <div className="notice" style={{ marginTop: 14 }}>
        <span className="notice-title">National context, not this city</span>
        {national.label}. {national.source}.
      </div>

      <p className="source" style={{ marginTop: 8 }}>
        PIN {data.pincode} → {data.district}, {data.state} (India Post). City rank is a 2017 survey figure; it is context, not a measure of this pilot.
      </p>
    </div>
  );
}
