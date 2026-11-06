import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Alag — Household segregation proof | अलग",
  description: "Collector-side household segregation proof for Swachh Bharat 2.0. Photo per bin, vision classification, WhatsApp nudges, pilot dashboard.",
};

const CPCB = "India generates ~1.7 lakh tonnes/day of municipal solid waste (CPCB Annual Report 2021-22 / 2022-23); only ~20% is processed — the rest is dumped or unaccounted. Source: CPCB Annual Report 2021-22 / 2022-23.";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0c7a3f" />
      </head>
      <body>
        <div className="topbar">
          <div className="topbar-inner">
            <div className="brand">
              अलग <span style={{ color: "var(--green)" }}>Alag</span>
              <small>Collector PWA • Swachh Bharat 2.0</small>
            </div>
            <nav className="nav">
              <Link href="/">Collector</Link>
              <Link href="/dashboard">Pilot</Link>
              <Link href="/leaderboard">RWA</Link>
            </nav>
          </div>
        </div>
        <main className="wrap">{children}</main>
        <div className="wrap" style={{ paddingTop: 0 }}>
          <div className="footer-note">
            <strong>CPCB context (real, cited):</strong> {CPCB} Ward/RWA names here are <em>Pilot-collected</em> — we do not invent ward numbers. Government figures are never seeded; only the 7-day pilot flow uses clearly labeled template data with a “Replace with live pilot” option. Live APIs used: India Post pincode, Nominatim geocoding, OSRM driving routes, Open-Meteo AQI. LLM: BharatCode qwen-3.8-27b (vision) with deterministic fallback.
          </div>
        </div>
      </body>
    </html>
  );
}
