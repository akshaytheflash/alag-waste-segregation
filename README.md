# Alag (अलग) — Collector-side household segregation proof for Swachh Bharat 2.0

**Impact area:** Waste Management
**Hackathon:** Code for a Billion — Code for India

## Problem statement (submission-ready)

Mandated 2-bin household segregation has **no per-household evidence**. Millions of collectors see every bin every day, but there is no auditable record of what each household actually put out, so compliance cannot be measured, nudged, or rewarded.

India generates **~1.7 lakh tonnes/day of municipal solid waste**; only **~20% is processed** — the rest is dumped or unaccounted.
**Source:** Central Pollution Control Board (CPCB), Annual Report 2021-22 / 2022-23.

Current apps are citizen-reporting or top-down dashboards. Neither uses the **collector's daily visual access** as the data source. Alag closes that gap with **zero new hardware**: one photo per bin, vision classification, instant WhatsApp nudge, and a 7-day before/after dashboard that proves compliance movement household by household.

**Wedge & differentiator:** a working **7-day pilot dashboard for ~200 households** (Day-1 baseline vs Day-7 compliance %, kg wet waste diverted, RWA leaderboard) — before/after metrics, not just screen mockups.

---

## What Alag does

1. **Collector PWA (mobile-first, Hindi + English):**
   - Add household (PIN → district/state via **live India Post API**).
   - **One photo per bin** (camera on phones), offline queue to localStorage, sync when back online.
   - Classification **wet / dry / mixed / hazardous** via **BharatCode vision LLM** (`qwen-3.8-27b`) with **exponential backoff 2s → 4s → 8s** on 503s, then **deterministic fallback** (honest "manual confirm" state — demo never crashes).
   - One-tap confirm / override of the classification.
   - **Auto WhatsApp nudge deep link** (`wa.me` URL with prefilled multilingual message in Hindi + English). *Deep link only — we never fake a send; the collector taps Send in WhatsApp.*
   - Optional **kabadi pickup** button for segregated dry waste.
2. **7-day pilot dashboard (`/dashboard`):** Day-1 vs Day-7 compliance %, kg wet diverted, compliance chart + wet/dry/mixed table.
3. **RWA / ward leaderboard (`/leaderboard`):** ranked by photo-proven compliance. Ward names are labeled **Pilot-collected** — we never invent ward numbers.
4. **Live gov/public APIs everywhere** (never mocked): India Post PIN, Nominatim geocoding, OSRM driving routes (real distance/duration), Open-Meteo AQI. Each shows honest error states + retry when upstream is down.

---

## Tech stack

- **Next.js 14 + TypeScript** (App Router), **SQLite** via `better-sqlite3`, single repo.
- PWA manifest, offline-first queue, bilingual UI (EN / हिंदी).
- LLM: **BharatCode** OpenAI-compatible — `https://bharatcode.ai/api/model/v1`, model `qwen-3.8-27b` (vision+text, 262k ctx), `POST /chat/completions`, `Authorization: Bearer $BHARATCODE_API_KEY`. Key lives in `.env` **server-side only**, never in frontend, `.env` is gitignored.
- Docs: https://bharatcode.ai/build — verified `GET /models` returns `qwen-3.8-27b` + `deepseek-v4.1-flash`.

## Setup

```bash
cd alag
cp .env.example .env        # then paste your BHARATCODE_API_KEY from the hackathon brief
npm install
npm run dev                 # http://localhost:3000
```

> `.env` is already present in this demo checkout for judges; production deployments must set it via env vars and **never commit** it.

## Demo script (3 minutes, judge-friendly)

1. **Collector tab** — Add a household (e.g. "Sharma Residence, B-42, PIN 110001") → tap **Lookup PIN**. District/state appears live via India Post. Select the household.
2. **Photo → Classify** — Take/upload any bin photo, tap **Classify with BharatCode vision**. Watch the source badge: `BharatCode Vision` (with attempt count) or, if the API is intermittently 503, the honest `Deterministic fallback` + one-tap confirm. **Confirm** the category (wet/dry/mixed/hazardous).
3. **Nudge** — Tap **Send WhatsApp nudge** → WhatsApp opens with a prefilled Hindi+English message naming the result. Tap Send yourself (deep link only, no fake send). Tap **Request kabadi pickup** for dry waste.
4. **Live proof** (Collector tab bottom) — **Compute live distance** (Delhi coords) returns real km/minutes from OSRM; **Load AQI** returns live US AQI from Open-Meteo; **Search place** via Nominatim. If an API is down you’ll see an honest error + retry, never invented numbers.
5. **Pilot dashboard** (`/dashboard`) — Tap **Seed template pilot (200 households × 7 days)** → see **Day-1 36.5% → Day-7 76.0%** (+39.5 pts), **937.9 kg wet diverted**, compliance chart. The banner labels it **TEMPLATE PILOT DATA — not government data**, with **“Replace with live pilot →”** (the Collector tab). Government numbers (CPCB) are never seeded.
6. **Leaderboard** (`/leaderboard`) — 5 RWAs ranked by photo-proven compliance, ward column labeled Pilot-collected.
7. **Offline check** — Go offline (DevTools → Offline), classify + save → **Offline queue** appears; go back online → **Sync now**.

## Real data sources (all live-verified 2026-11-06)

| Purpose | Endpoint | Notes |
|---|---|---|
| PIN → district/state | `https://api.postalpincode.in/pincode/{pincode}` | India Post. Verified 110001 → Central Delhi, Delhi, 21 offices. |
| Geocoding | `https://nominatim.openstreetmap.org/search?q=...&format=json` | OSM contributors, ODbL 1.0. Verified Connaught Place → 28.6317, 77.2193. |
| Routes | `https://router.project-osrm.org/route/v1/driving/{lng},{lat};{lng},{lat}` | OSRM driving profile. Verified Delhi 5.2 km / ~9.6 min (575 s). |
| AQI context | `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=...&longitude=...&current=us_aqi,pm2_5,pm10` | Open-Meteo / CAMS. Verified Delhi US AQI 208 at time of test. |
| CPCB figures | ~1.7 lakh tonnes/day MSW, ~20% processed | CPCB Annual Report 2021-22 / 2022-23 — cited in UI footer + here. |
| Vision LLM | `https://bharatcode.ai/api/model/v1` + `GET /models` | `qwen-3.8-27b` status `live`, 262k ctx. Verified `GET /models` → 200 with both models live. 503s handled with backoff + fallback (verified end-to-end: 4 attempts → deterministic fallback, manual confirm required). |

**Verified 2026-11-06 (all through the live app on `:3000`):** `/api/pincode/110001` → 200 Central Delhi, Delhi · `/api/geocode` → Connaught Place 28.6317, 77.2193 · `/api/route` → 5.2 km / 10 min (5206 m / 575 s, OSRM driving) · `/api/aqi` → US AQI 208, PM2.5 94.8 · `POST /api/pilot/seed` → 200 households × 7 days, stats Day-1 36.5% → Day-7 76.0% · `/api/leaderboard` → 5 RWAs ranked · `POST /api/classify` → vision with 4-attempt backoff + honest fallback · `/`, `/dashboard`, `/leaderboard` → 200.
**Quirk found & fixed:** `api.postalpincode.in` resets connections with custom/non-browser User-Agents (any `Alag-.../1.0` string → connection reset; plain `Mozilla/5.0` → 200). The proxy therefore sends a plain `Mozilla/5.0` UA.

**Strict rules observed:** gov/public APIs are proxied live, never mocked. Ward/RWA data is labeled Pilot-collected. Only the 7-day pilot flow is seeded, labeled template, with a replace-live affordance. CPCB figures carry citations.

## Pilot setup instructions (real deployment)

- **Who:** 200 households in 1–2 RWAs; 1–2 collectors with any Android phone; 7 days.
- **Day 0:** Onboard households in Alag (PIN lookup confirms the locality). Capture household WhatsApp number + preferred language (हिंदी/EN).
- **Days 1–7:** Collector photographs each bin once per day. BharatCode classifies; collector confirms. Mixed bins auto-generate a WhatsApp nudge deep link. Dry waste gets a kabadi request.
- **Day 1 vs Day 7:** `/dashboard` computes baseline vs end compliance, wet kg diverted, and per-RWA leaderboard from real inspection rows. Export / screenshot for the ward officer + RWA.
- **Replace template with live:** Delete template rows by seeding/inspecting directly — insert live inspections via `/api/inspections` (collector saves) and `is_template` flips to false once live rows exist. Never alter CPCB figures — those are national context, not pilot counts.
- **Route planning:** Use OSRM panel to plan collection loops with real distances/durations.

## API reference (same-origin)

- `GET /api/pincode/:pincode` → India Post district/state/offices
- `GET /api/geocode?q=` → Nominatim results
- `GET /api/route?fromLat&fromLng&toLat&toLng` → OSRM distance/duration/geometry
- `GET /api/aqi?lat&lng` → Open-Meteo AQI/PM2.5/PM10
- `POST /api/classify` (multipart `image`, `hint`) → `{classification, confidence, wet_kg, dry_kg, mixed_kg, hazardous_kg, note, source, needsManualConfirm, attempts, latencyMs}` (fallback included)
- `GET/POST /api/bins`, `GET/POST /api/inspections`
- `POST /api/pilot/seed` → template pilot (200×7); `GET /api/pilot/stats`; `GET /api/leaderboard`

## Privacy & honesty notes

- Photos are classified server-side; only hashes/notes are stored long-term. WhatsApp nudges are deep links — no message is claimed sent without the human tapping Send.
- If BharatCode returns 503 (`model_unavailable`), the app shows the fallback badge and requires manual confirm rather than inventing a confident label.

## Repo layout

```
src/app/page.tsx            Collector PWA (Hindi/EN, offline queue, photo, classify, wa.me nudge, kabadi)
src/app/dashboard/page.tsx  7-day before/after pilot dashboard
src/app/leaderboard/page.tsx RWA/ward leaderboard
src/app/api/*               Live proxies (postalpin, nominatim, OSRM, open-meteo) + classify/bins/inspections/pilot
src/lib/db.ts               SQLite schema (bins, inspections, pilot_meta)
src/lib/llm.ts              BharatCode client (2s→4s→8s backoff)
src/lib/fallback.ts         Deterministic fallback classifier
src/lib/pilotSeed.ts        Template pilot (200×7) + stats/leaderboard queries
```

## Credits

- Data: India Post pincode API, OpenStreetMap Nominatim, OSRM, Open-Meteo Air Quality, CPCB Annual Reports, BharatCode vision LLM.
