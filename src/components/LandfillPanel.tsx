"use client";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

type Site = {
  id: string;
  name: string;
  operator: string | null;
  lat: number;
  lng: number;
  distanceKm: number;
  osmUrl: string;
};

type Result = {
  available: boolean;
  sites: Site[];
  center: { lat: number; lng: number };
  bbox: { south: number; west: number; north: number; east: number };
  fetchedAt: string;
  source: string;
  mirror: string | null;
  cached: boolean;
  error: string | null;
  osmSearchUrl: string;
};

function embedUrl(r: Result) {
  const site = r.sites[0];
  const lat = site?.lat ?? r.center.lat;
  const lng = site?.lng ?? r.center.lng;
  const dLat = 0.055;
  const dLng = 0.08;
  const bbox = `${(lng - dLng).toFixed(5)},${(lat - dLat).toFixed(5)},${(lng + dLng).toFixed(5)},${(lat + dLat).toFixed(5)}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

export default function LandfillPanel({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label: string;
}) {
  const { t } = useI18n();
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`/api/landfills?lat=${lat}&lng=${lng}&radius=25`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (e: any) {
      setErr(e?.message || t("dump.lookupFailed"));
      setData(null);
    }
  }, [lat, lng, t]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="stack" aria-live="polite">
        <div className="map-frame" style={{ height: 240, display: "grid", placeItems: "center" }}>
          <p className="small muted" style={{ padding: 20, textAlign: "center" }}>
            {t("dump.querying")}
          </p>
        </div>
        <p className="source">{t("dump.mirrors")}</p>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div>
        <div className="notice red">
          <span className="notice-title">{t("dump.unavailable")}</span>
          {err || t("dump.noAnswer")} {t("dump.noCoords")}
        </div>
        <a
          className="btn btn-quiet btn-sm"
          href={`https://www.openstreetmap.org/#map=12/${lat}/${lng}`}
          target="_blank"
          rel="noreferrer"
        >
          {t("dump.checkArea")}
        </a>
      </div>
    );
  }

  if (!data.available) {
    return (
      <div>
        <div className="notice red">
          <span className="notice-title">{t("dump.unavailable")}</span>
          {t("dump.allFailed", { error: data.error || "" })}
        </div>
        <a className="btn btn-quiet btn-sm" href={data.osmSearchUrl} target="_blank" rel="noreferrer">
          {t("dump.openArea")}
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="map-frame">
        <iframe
          title={t("dump.mapTitle", { label })}
          src={embedUrl(data)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="map-caption">
          <span>
            {data.sites.length > 0
              ? t(data.sites.length === 1 ? "dump.countOne" : "dump.countMany", {
                  count: data.sites.length,
                })
              : t("dump.none")}
          </span>
          <a href={data.osmSearchUrl} target="_blank" rel="noreferrer">
            {t("dump.larger")}
          </a>
        </div>
      </div>

      {data.sites.length > 0 ? (
        <ul className="site-list">
          {data.sites.map((s) => (
            <li key={s.id}>
              <div>
                <div className="site-name">{s.name}</div>
                <div className="site-meta">
                  {s.operator ? `${s.operator} · ` : ""}
                  {s.lat.toFixed(5)}, {s.lng.toFixed(5)} ·{" "}
                  <a href={s.osmUrl} target="_blank" rel="noreferrer">
                    OSM {s.id}
                  </a>
                </div>
              </div>
              <div className="site-dist num">
                {s.distanceKm.toFixed(1)} km
                <small>{t("dump.fromCentre")}</small>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty" style={{ marginTop: 10 }}>
          <b>{t("dump.emptyTitle")}</b>
          {t("dump.emptyBody")}
        </div>
      )}

      <p className="source" style={{ marginTop: 8 }}>
        {data.cached
          ? t("dump.footnoteCached", {
              source: data.source,
              label,
              lat: data.center.lat.toFixed(4),
              lng: data.center.lng.toFixed(4),
            })
          : t("dump.footnoteFetched", {
              source: data.source,
              label,
              lat: data.center.lat.toFixed(4),
              lng: data.center.lng.toFixed(4),
            })}{" "}
        {data.mirror ? t("dump.mirror", { host: new URL(data.mirror).host }) : ""}{" "}
        {t("dump.footnoteTail")}
      </p>
    </div>
  );
}
