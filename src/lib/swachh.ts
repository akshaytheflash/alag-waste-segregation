// Swachh Survekshan city context.
//
// Two sources, in order:
//  1. data.gov.in resource "Swachh Sarvekshan Rank 2016-17" (live, cached 24h)
//  2. A verified extract of the official PIB release of 4 May 2017, used only
//     when the data.gov.in key is rate-limited (HTTP 429). Every row keeps the
//     source it came from; nothing is interpolated.
//
// The PIB release lists 434 AMRUT cities/towns. We carry the rows relevant to
// the pilot cities and the largest urban bodies, not a made-up full table.
import { ageMinutes, readCache, writeCache } from "./cache";

// No key in source. Without DATA_GOV_API_KEY we skip the live call and use the
// cited PIB 2017 extract below; every row keeps the source it came from.
const DATA_GOV_KEY = process.env.DATA_GOV_API_KEY || "";
const RANK_RESOURCE = "sgcjv2w3mbk4r2skkbph5nn0tinky6sj";
const SWM_RESOURCE = "jghm3rzlp30le6opphd8wf0u4hfmfpzg";

const RANK_SOURCE_URL =
  "https://api.data.gov.in/resource/sgcjv2w3mbk4r2skkbph5nn0tinky6sj";
const PIB_URL = "https://www.pib.gov.in/PressReleasePage.aspx?PRID=1489139";
const SWM_SOURCE_URL =
  "https://api.data.gov.in/resource/jghm3rzlp30le6opphd8wf0u4hfmfpzg";

const CACHE_TTL_MIN = 60 * 24;

export type RankRow = {
  city: string;
  state: string;
  rank: number;
  of: number;
  year: string;
  source: string;
  sourceUrl: string;
  live: boolean;
};

export type SwmRow = {
  city: string;
  generatedTpd: number | null;
  collectedTpd: number | null;
  processedTpd: number | null;
  year: string;
  source: string;
  sourceUrl: string;
  live: boolean;
};

// PIB, "Swachh Survekshan – 2017: Sanitation Rankings of Cities/Towns
// State/UT-wise", 4 May 2017. 434 cities/towns surveyed.
const PIB: Array<[string, string, number]> = [
  ["Indore", "Madhya Pradesh", 1],
  ["Bhopal", "Madhya Pradesh", 2],
  ["Visakhapatnam", "Andhra Pradesh", 3],
  ["Surat", "Gujarat", 4],
  ["Mysuru", "Karnataka", 5],
  ["Tiruchirappalli", "Tamil Nadu", 6],
  ["NDMC", "Delhi", 7],
  ["Navi Mumbai", "Maharashtra", 8],
  ["Tirupati", "Andhra Pradesh", 9],
  ["Vadodara", "Gujarat", 10],
  ["Chandigarh", "Chandigarh", 11],
  ["Ujjain", "Madhya Pradesh", 12],
  ["Pune", "Maharashtra", 13],
  ["Ahmedabad", "Gujarat", 14],
  ["Ambikapur", "Chhattisgarh", 15],
  ["Coimbatore", "Tamil Nadu", 16],
  ["Khargone", "Madhya Pradesh", 17],
  ["Rajkot", "Gujarat", 18],
  ["Vijayawada", "Andhra Pradesh", 19],
  ["Gandhinagar", "Gujarat", 20],
  ["Jabalpur", "Madhya Pradesh", 21],
  ["Greater Hyderabad", "Telangana", 22],
  ["Sagar", "Madhya Pradesh", 23],
  ["Katni", "Madhya Pradesh", 24],
  ["Navsari", "Gujarat", 25],
  ["Vapi", "Gujarat", 26],
  ["Gwalior", "Madhya Pradesh", 27],
  ["Warangal", "Telangana", 28],
  ["Greater Mumbai", "Maharashtra", 29],
  ["Suryapet", "Telangana", 30],
  ["Varanasi", "Uttar Pradesh", 32],
  ["Bhavnagar", "Gujarat", 33],
  ["Jamnagar", "Gujarat", 35],
  ["Kumbakonam", "Tamil Nadu", 37],
  ["Erode", "Tamil Nadu", 42],
  ["Kakinada", "Andhra Pradesh", 43],
  ["Shimla", "Himachal Pradesh", 47],
  ["Gangtok", "Sikkim", 50],
  ["Shirdi", "Maharashtra", 56],
  ["Madurai", "Tamil Nadu", 57],
  ["Mangaluru", "Karnataka", 63],
  ["Jamshedpur", "Jharkhand", 64],
  ["Karnal", "Haryana", 65],
  ["Pimpri Chinchwad", "Maharashtra", 72],
  ["Durg", "Chhattisgarh", 85],
  ["Faridabad", "Haryana", 88],
  ["Bhubaneswar", "Odisha", 94],
  ["Aizawl", "Mizoram", 105],
  ["Dhanbad", "Jharkhand", 109],
  ["Gurugram", "Haryana", 112],
  ["Thane", "Maharashtra", 116],
  ["Ranchi", "Jharkhand", 117],
  ["Imphal", "Manipur", 122],
  ["Raipur", "Chhattisgarh", 129],
  ["Guwahati", "Assam", 134],
  ["Nagpur", "Maharashtra", 137],
  ["Ludhiana", "Punjab", 140],
  ["Aligarh", "Uttar Pradesh", 145],
  ["Nashik", "Maharashtra", 151],
  ["Delhi Cantonment", "Delhi", 172],
  ["Kanpur", "Uttar Pradesh", 175],
  ["South MCD", "Delhi", 202],
  ["East MCD", "Delhi", 196],
  ["Jodhpur", "Rajasthan", 209],
  ["Bengaluru", "Karnataka", 210],
  ["Jaipur", "Rajasthan", 215],
  ["Itanagar", "Arunachal Pradesh", 216],
  ["Greater Chennai", "Tamil Nadu", 235],
  ["Srinagar", "Jammu & Kashmir", 241],
  ["Allahabad", "Uttar Pradesh", 247],
  ["Jammu", "Jammu & Kashmir", 251],
  ["Kozhikode", "Kerala", 254],
  ["Amritsar", "Punjab", 258],
  ["Patna", "Bihar", 262],
  ["Agra", "Uttar Pradesh", 263],
  ["Lucknow", "Uttar Pradesh", 269],
  ["Kochi", "Kerala", 271],
  ["North MCD", "Delhi", 279],
  ["Dehradun", "Uttarakhand", 316],
  ["Meerut", "Uttar Pradesh", 339],
  ["Ghaziabad", "Uttar Pradesh", 351],
  ["Thiruvananthapuram", "Kerala", 372],
];

const PIB_ROWS: RankRow[] = PIB.map(([city, state, rank]) => ({
  city,
  state,
  rank,
  of: 434,
  year: "2017",
  source: "PIB / MoHUA, Swachh Survekshan 2017",
  sourceUrl: PIB_URL,
  live: false,
}));

const ALIASES: Record<string, string> = {
  "new delhi": "ndmc",
  ndmc: "ndmc",
  "new delhi municipal council": "ndmc",
  bangalore: "bengaluru",
  bengaluru: "bengaluru",
  bombay: "greater mumbai",
  mumbai: "greater mumbai",
  "mumbai suburban": "greater mumbai",
  madras: "greater chennai",
  chennai: "greater chennai",
  hyderabad: "greater hyderabad",
  secunderabad: "greater hyderabad",
  mysore: "mysuru",
  trichy: "tiruchirappalli",
  tiruchirapally: "tiruchirappalli",
  prayagraj: "allahabad",
  gurgaon: "gurugram",
  vizag: "visakhapatnam",
  trivandrum: "thiruvananthapuram",
  cochin: "kochi",
  calicut: "kozhikode",
  mangalore: "mangaluru",
  shimoga: "shivamogga",
  belgaum: "belagavi",
  gulbarga: "kalaburagi",
  bijapur: "vijayapura",
  tumkur: "tumkuru",
  hubli: "hubbali-dharwad",
  "hubli dharwad": "hubbali-dharwad",
  "pimpri-chinchwad": "pimpri chinchwad",
  "kalyan dombivli": "kalyan-dombivli",
  "vasai-virar": "vasai virar",
  "sangli miraj kupwad": "sangli miraj kupwad",
  "greater noida": "noida",
  noida: "noida",
};

export function normaliseCity(value: string) {
  let s = String(value || "")
    .toLowerCase()
    .replace(/[.,()/]/g, " ")
    .replace(/\bmunicipal corporation\b/g, " ")
    .replace(/\bmunicipal council\b/g, " ")
    .replace(/\bcity\b/g, " ")
    .replace(/\burban\b/g, " ")
    .replace(/\brural\b/g, " ")
    .replace(/\bdistrict\b/g, " ")
    .replace(/\bgreater\b/g, " ")
    .replace(/\bnagar\b/g, " ")
    .replace(/\bpalike\b/g, " ")
    .replace(/\bmcd\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (ALIASES[s]) return ALIASES[s];
  return s;
}

function rankIndex(rows: RankRow[]) {
  const index = new Map<string, RankRow>();
  for (const row of rows) {
    const key = normaliseCity(row.city);
    if (key && !index.has(key)) index.set(key, row);
  }
  return index;
}

const PIB_INDEX = rankIndex(PIB_ROWS);

const DELHI_BODY: Record<string, string> = {
  "New Delhi": "NDMC",
  "North Delhi": "North MCD",
  "South Delhi": "South MCD",
  "East Delhi": "East MCD",
};

export type RankMatch = {
  row: RankRow | null;
  note: string;
  alternatives?: RankRow[];
  matchedBy: string | null;
};

export function matchRank(
  district: string,
  state: string,
  pincode: string,
  liveRows: RankRow[]
): RankMatch {
  const liveIndex = rankIndex(liveRows);

  // Delhi is ranked by municipal body, not by district. Do not guess.
  if (/delhi/i.test(state)) {
    const pinBody = pincode === "110001" ? "NDMC" : null;
    const body = pinBody || DELHI_BODY[district] || null;
    const key = body ? normaliseCity(body) : "";
    const row = (key && (liveIndex.get(key) || PIB_INDEX.get(key))) || null;
    const alternatives = ["NDMC", "South MCD", "East MCD", "North MCD", "Delhi Cantonment"]
      .map((b) => liveIndex.get(normaliseCity(b)) || PIB_INDEX.get(normaliseCity(b)))
      .filter((r): r is RankRow => Boolean(r));
    if (row) {
      return {
        row,
        note:
          pincode === "110001"
            ? "PIN 110001 sits in the New Delhi Municipal Council area. Delhi is ranked by municipal body, not district."
            : `${district} is served by ${body}. Delhi is ranked by municipal body, not district.`,
        alternatives,
        matchedBy: body,
      };
    }
    return {
      row: null,
      note: `${district} spans more than one Delhi municipal body, so no single city rank is published. The 2017 ranks: NDMC 7, South MCD 202, East MCD 196, North MCD 279.`,
      alternatives,
      matchedBy: null,
    };
  }

  const candidates = [
    district,
    district.replace(/\s+(Urban|Rural)$/i, ""),
    normaliseCity(district),
  ];

  for (const candidate of candidates) {
    const key = normaliseCity(candidate);
    const row = liveIndex.get(key) || PIB_INDEX.get(key);
    if (row) {
      return { row, note: "", matchedBy: candidate };
    }
  }

  return {
    row: null,
    note: `No Swachh Survekshan row matches "${district}" in the published data.`,
    matchedBy: null,
  };
}

async function getJson(url: string, timeoutMs = 7000) {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export type RankFeed = {
  rows: RankRow[];
  live: boolean;
  fetchedAt: string;
  error: string | null;
  sourceUrl: string;
};

export async function loadRankFeed(): Promise<RankFeed> {
  const cached = readCache<RankFeed>("swachh-ranks-v1.json");
  if (cached && ageMinutes(cached.at) < CACHE_TTL_MIN) return cached.data;

  if (!DATA_GOV_KEY)
    return {
      rows: PIB_ROWS,
      live: false,
      fetchedAt: "2017-05-04",
      error: "No data.gov.in key configured. Showing the verified PIB release of 4 May 2017 instead.",
      sourceUrl: PIB_URL,
    };

  try {
    const url = `https://api.data.gov.in/resource/${RANK_RESOURCE}?api-key=${DATA_GOV_KEY}&format=json&limit=1000`;
    const json = await getJson(url);
    const records: any[] = json?.records || [];
    const rows: RankRow[] = records
      .map((r) => ({
        city: String(r.city || "").trim(),
        state: String(r.state || r.State || "").trim(),
        rank: Number(r.swachh_sarvekshan_rank ?? r["Swachh  Sarvekshan rank"]),
        of: 434,
        year: "2017",
        source: "data.gov.in — Swachh Sarvekshan Rank 2016-17",
        sourceUrl: RANK_SOURCE_URL,
        live: true,
      }))
      .filter((r) => r.city && Number.isFinite(r.rank) && r.rank > 0 && r.rank <= 434);

    if (!rows.length) throw new Error("data.gov.in returned no rank rows");

    const feed: RankFeed = {
      rows,
      live: true,
      fetchedAt: new Date().toISOString(),
      error: null,
      sourceUrl: RANK_SOURCE_URL,
    };
    writeCache("swachh-ranks-v1.json", feed);
    return feed;
  } catch (e: any) {
    if (cached) {
      return {
        ...cached.data,
        error: `Live refresh failed (${e?.message || "upstream error"}); showing cached rows from ${new Date(
          cached.at
        ).toISOString()}.`,
      };
    }
    return {
      rows: PIB_ROWS,
      live: false,
      fetchedAt: "2017-05-04",
      error: `data.gov.in unavailable (${e?.message || "upstream error"}). Showing the verified PIB release of 4 May 2017 instead.`,
      sourceUrl: PIB_URL,
    };
  }
}

export type SwmFeed = {
  rows: SwmRow[];
  live: boolean;
  fetchedAt: string;
  error: string | null;
  sourceUrl: string;
};

export async function loadSwmFeed(): Promise<SwmFeed> {
  const cached = readCache<SwmFeed>("swm-rows-v1.json");
  if (cached && ageMinutes(cached.at) < CACHE_TTL_MIN) return cached.data;

  if (!DATA_GOV_KEY)
    return {
      rows: [],
      live: false,
      fetchedAt: new Date().toISOString(),
      error: "No data.gov.in key configured. No city solid-waste row is shown rather than an invented one.",
      sourceUrl: SWM_SOURCE_URL,
    };

  try {
    const url = `https://api.data.gov.in/resource/${SWM_RESOURCE}?api-key=${DATA_GOV_KEY}&format=json&limit=1000`;
    const json = await getJson(url);
    const records: any[] = json?.records || [];
    const rows: SwmRow[] = records
      .map((r) => {
        const gen = Number(
          r.total_quantum_of_msw_generated_in_the_city_in_metric_tonnes___2017_18 ??
            r.total_quantum_of_msw_generated_in_the_city_in_metric_tonnes___2016_17 ??
            r.total_quantum_of_msw_generated_in_the_city_in_metric_tonnes___2015_16
        );
        const col = Number(
          r.total_quantum_of_msw_collected_by_the_ulb_or_private_operator_in_metric_tonnes___2017_18 ??
            r.total_quantum_of_msw_collected_by_the_ulb_or_private_operator_in_metric_tonnes___2016_17
        );
        const proc = Number(
          r.average_quantum_of_msw_that_is_processed_or_recycled_in_metric_tonnes___2017_18 ??
            r.average_quantum_of_msw_that_is_processed_or_recycled_in_metric_tonnes___2016_17
        );
        return {
          city: String(r.city_name || "").trim(),
          generatedTpd: Number.isFinite(gen) ? gen : null,
          collectedTpd: Number.isFinite(col) ? col : null,
          processedTpd: Number.isFinite(proc) ? proc : null,
          year: "2017-18",
          source: "data.gov.in — Solid Waste Management (ULB returns)",
          sourceUrl: SWM_SOURCE_URL,
          live: true,
        };
      })
      .filter((r) => r.city);

    const feed: SwmFeed = {
      rows,
      live: true,
      fetchedAt: new Date().toISOString(),
      error: null,
      sourceUrl: SWM_SOURCE_URL,
    };
    writeCache("swm-rows-v1.json", feed);
    return feed;
  } catch (e: any) {
    if (cached) {
      return {
        ...cached.data,
        error: `Live refresh failed (${e?.message || "upstream error"}); showing cached rows from ${new Date(
          cached.at
        ).toISOString()}.`,
      };
    }
    return {
      rows: [],
      live: false,
      fetchedAt: new Date().toISOString(),
      error: `data.gov.in unavailable (${e?.message || "upstream error"}). No city solid-waste row is shown rather than an invented one.`,
      sourceUrl: SWM_SOURCE_URL,
    };
  }
}

export function matchSwm(city: string, rows: SwmRow[]) {
  const key = normaliseCity(city);
  if (!key) return null;
  return (
    rows.find((r) => normaliseCity(r.city) === key) ||
    rows.find((r) => {
      const k = normaliseCity(r.city);
      return k.startsWith(key) || key.startsWith(k);
    }) ||
    null
  );
}

export const NATIONAL_CONTEXT = {
  generatedTpd: 170000,
  processedPct: 20,
  label: "~1.7 lakh tonnes/day of municipal solid waste; ~20% processed",
  source: "CPCB Annual Report 2021-22 / 2022-23",
  sourceUrl: "https://cpcb.nic.in/annual-report/",
};
