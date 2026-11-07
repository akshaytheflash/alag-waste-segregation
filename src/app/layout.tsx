import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Alag — one bin, one photo, one proof",
  description:
    "Collector-side household segregation proof for Swachh Bharat 2.0. A photo per bin, a vision read, a WhatsApp nudge, and a ward register that shows what changed.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anek+Devanagari:wght@300..700&family=Anek+Latin:wght@300..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a href="#main" className="sr-only">
          Skip to content
        </a>
        <header className="masthead">
          <div className="masthead-inner">
            <Link href="/" className="brand" aria-label="Alag home">
              <span className="brand-devanagari">अलग</span>
              <span className="brand-latin">
                Alag
                <small>household segregation proof</small>
              </span>
            </Link>
            <SiteNav />
          </div>
        </header>

        <main id="main" className="page">
          {children}
        </main>

        <footer className="colophon">
          <div className="colophon-inner">
            <h2>What the numbers on this page are, and are not</h2>
            <p>
              Government and map figures are pulled live and carry their source and date. Pilot figures come from photos recorded in
              this app; until the seed is replaced they are labelled template. No ward number, rank, coordinate, or complaint number is
              invented. Where a source has no row for a place, the page says so.
            </p>
            <ul className="src-list">
              <li>
                National waste context: ~1.7 lakh tonnes/day generated, ~20% processed — CPCB Annual Report 2021-22 / 2022-23.
              </li>
              <li>
                City rank: Swachh Survekshan 2017, MoHUA / PIB release of 4 May 2017, or the data.gov.in resource when the API key is
                not rate-limited.
              </li>
              <li>
                City solid waste: data.gov.in, Solid Waste Management ULB returns (2015-16 to 2017-18). Missing rows are shown as not
                published.
              </li>
              <li>Waste composition: 50% wet, 30% dry, 20% inert — CPCB, typical Indian municipal solid waste.</li>
              <li>
                Impact model: 0.45 kg/person/day (CPHEEO Manual on MSW Management, 2016) × 4.4 persons/household (NFHS-5, 2019-21).
              </li>
              <li>Dumpsites: OpenStreetMap contributors, ODbL 1.0, queried through the Overpass API; no coordinates are generated.</li>
              <li>PIN and place lookups: India Post and OpenStreetMap Nominatim. Routing: OSRM. Air: Open-Meteo / CAMS.</li>
            </ul>
            <p style={{ marginTop: 12 }}>
              <strong>अलग</strong> means separate. Built for the collector who sees every bin, every day.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
