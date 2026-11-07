"use client";
import { useCallback, useEffect, useState } from "react";

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
      setErr(e?.message || "Landfill lookup failed");
      setData(null);
    }
    setLoading(false);
  }, [lat, lng]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="stack" aria-live="polite">
        <div className="map-frame" style={{ height: 240, display: "grid", placeItems: "center" }}>
          <p className="small muted" style={{ padding: 20, textAlign: "center" }}>
            Querying OpenStreetMap Overpass for <b>landuse=landfill</b> inside a 25 km box…
          </p>
        </div>
        <p className="source">Mirrors are tried in order with backoff. Nothing is drawn until OSM returns a real element.</p>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div>
        <div className="notice red">
          <span className="notice-title">Map data unavailable</span>
          {err || "No answer from the Overpass mirrors."} No coordinates are generated here.
        </div>
        <a className="btn btn-quiet btn-sm" href={`https://www.openstreetmap.org/#map=12/${lat}/${lng}`} target="_blank" rel="noreferrer">
          Check this area on OpenStreetMap
        </a>
      </div>
    );
  }

  if (!data.available) {
    return (
      <div>
        <div className="notice red">
          <span className="notice-title">Map data unavailable</span>
          All three Overpass mirrors failed. {data.error}
        </div>
        <a className="btn btn-quiet btn-sm" href={data.osmSearchUrl} target="_blank" rel="noreferrer">
          Open this area on OpenStreetMap
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="map-frame">
        <iframe
          title={`OpenStreetMap around ${label}`}
          src={embedUrl(data)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="map-caption">
          <span>
            {data.sites.length > 0
              ? `${data.sites.length} mapped landfill${data.sites.length === 1 ? "" : "s"} within 25 km`
              : "No mapped landfill in this 25 km box"}
          </span>
          <a href={data.osmSearchUrl} target="_blank" rel="noreferrer">
            Larger map
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
                <small>from centre</small>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty" style={{ marginTop: 10 }}>
          <b>OpenStreetMap has no landfill mapped here.</b>
          That is a gap in OSM, not proof that no dumpsite exists. Add one from a survey, or check the city&apos;s SWM plan.
        </div>
      )}

      <p className="source" style={{ marginTop: 8 }}>
        {data.source}. {data.cached ? "Cached answer" : "Fetched now"} for a 25 km box around {label} ({data.center.lat.toFixed(4)},{" "}
        {data.center.lng.toFixed(4)}). {data.mirror ? `Mirror: ${new URL(data.mirror).host}.` : ""} Coordinates are OSM element centres; none are estimated.
      </p>
    </div>
  );
}
