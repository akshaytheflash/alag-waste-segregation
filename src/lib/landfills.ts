// Real dumpsite / landfill lookup from OpenStreetMap Overpass.
// No coordinates are generated here: every site comes from an OSM element with
// landuse=landfill. Mirrors are tried in order with backoff, and a successful
// answer is cached to a dated JSON file so a rate-limited mirror does not blank
// the field tool.
import { cachePath, isoDay, readCache, writeCache } from "./cache";
import crypto from "crypto";
import fs from "fs";

const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

export type LandfillSite = {
  id: string;
  name: string;
  operator: string | null;
  lat: number;
  lng: number;
  distanceKm: number;
  osmUrl: string;
};

export type LandfillResult = {
  available: boolean;
  sites: LandfillSite[];
  center: { lat: number; lng: number };
  bbox: { south: number; west: number; north: number; east: number };
  fetchedAt: string;
  source: string;
  mirror: string | null;
  cached: boolean;
  error: string | null;
  osmSearchUrl: string;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

function bboxFor(lat: number, lng: number, km: number) {
  const dLat = km / 111;
  const dLng = km / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  return {
    south: Math.round((lat - dLat) * 10000) / 10000,
    west: Math.round((lng - dLng) * 10000) / 10000,
    north: Math.round((lat + dLat) * 10000) / 10000,
    east: Math.round((lng + dLng) * 10000) / 10000,
  };
}

export async function findLandfills(lat: number, lng: number, radiusKm = 25) {
  const bbox = bboxFor(lat, lng, radiusKm);
  const key = crypto
    .createHash("sha1")
    .update(`${bbox.south},${bbox.west},${bbox.north},${bbox.east}`)
    .digest("hex")
    .slice(0, 8);
  const day = isoDay();
  const file = `landfills-${day}-${key}.json`;

  const cached = readCache<Omit<LandfillResult, "cached">>(file);
  if (cached) {
    return { ...cached.data, cached: true };
  }

  const query = `[out:json][timeout:20];nwr["landuse"="landfill"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});out center;`;

  let lastError = "";
  for (let i = 0; i < MIRRORS.length; i++) {
    if (i > 0) await sleep(i === 1 ? 1200 : 2600);
    const mirror = MIRRORS[i];

    // POST is the documented form. Some mirrors reject the body but answer a
    // GET with ?data=, so each mirror gets one of each before moving on.
    for (const method of ["POST", "GET"] as const) {
      try {
        const url =
          method === "GET" ? `${mirror}?data=${encodeURIComponent(query)}` : mirror;
        const res = await fetch(url, {
          method,
          headers: {
            Accept: "application/json",
            "User-Agent": "Alag-Pilot/1.0 (municipal waste field tool)",
            ...(method === "POST"
              ? { "Content-Type": "application/x-www-form-urlencoded" }
              : {}),
          },
          body: method === "POST" ? `data=${encodeURIComponent(query)}` : undefined,
          cache: "no-store",
          signal: AbortSignal.timeout(method === "POST" ? 14000 : 20000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const elements: any[] = json?.elements || [];

        const seen = new Set<string>();
        const sites: LandfillSite[] = [];
        for (const el of elements) {
          const id = `${el.type}/${el.id}`;
          if (seen.has(id)) continue;
          seen.add(id);
          const sLat = Number(el.center?.lat ?? el.lat);
          const sLng = Number(el.center?.lon ?? el.lon);
          if (!Number.isFinite(sLat) || !Number.isFinite(sLng)) continue;
          if (sLat < bbox.south || sLat > bbox.north || sLng < bbox.west || sLng > bbox.east) continue;
          sites.push({
            id,
            name:
              el.tags?.["name:en"] ||
              el.tags?.name ||
              el.tags?.operator ||
              "Unnamed landfill (OSM)",
            operator: el.tags?.operator || null,
            lat: Math.round(sLat * 100000) / 100000,
            lng: Math.round(sLng * 100000) / 100000,
            distanceKm: haversineKm(lat, lng, sLat, sLng),
            osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
          });
        }
        sites.sort((a, b) => a.distanceKm - b.distanceKm);

        const result = {
          available: true,
          sites: sites.slice(0, 12),
          center: { lat, lng },
          bbox,
          fetchedAt: new Date().toISOString(),
          source: "OpenStreetMap contributors (ODbL 1.0), Overpass API",
          mirror,
          error: null,
          osmSearchUrl: `https://www.openstreetmap.org/#map=12/${lat}/${lng}`,
        };
        writeCache(file, result);
        return { ...result, cached: false };
      } catch (e: any) {
        lastError = `${mirror} (${method}): ${e?.message || "request failed"}`;
      }
    }
  }

  // Keep an older dated file for this bbox rather than inventing data.
  try {
    const dir = cachePath("");
    const prefix = `landfills-`;
    const suffix = `-${key}.json`;
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith(prefix) && f.endsWith(suffix))
      .sort()
      .reverse();
    if (files.length) {
      const stale = readCache<Omit<LandfillResult, "cached">>(files[0]);
      if (stale) {
        return {
          ...stale.data,
          cached: true,
          error: `Live Overpass request failed (${lastError}). Showing the cached answer from ${new Date(
            stale.at
          ).toISOString()}.`,
        };
      }
    }
  } catch {
    // ignore
  }

  return {
    available: false,
    sites: [],
    center: { lat, lng },
    bbox,
    fetchedAt: new Date().toISOString(),
    source: "OpenStreetMap contributors (ODbL 1.0), Overpass API",
    mirror: null,
    cached: false,
    error: `All three Overpass mirrors failed. ${lastError}`,
    osmSearchUrl: `https://www.openstreetmap.org/#map=12/${lat}/${lng}`,
  };
}
