import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { I18nProvider } from "@/components/I18nProvider";
import { getI18n } from "@/lib/i18n/server";
import { INDIC_FONTS_HREF } from "@/lib/i18n/fonts";

export function generateMetadata(): Metadata {
  const { t } = getI18n();
  return {
    title: t("layout.metaTitle"),
    description: t("layout.metaDescription"),
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, dir, t } = getI18n();
  return (
    <html lang={locale} dir={dir}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anek+Devanagari:wght@300..700&family=Anek+Latin:wght@300..800&display=swap"
          rel="stylesheet"
        />
        <link href={INDIC_FONTS_HREF} rel="stylesheet" />
      </head>
      <body>
        <I18nProvider initialLocale={locale}>
        <a href="#main" className="sr-only">
          {t("layout.skip")}
        </a>
        <header className="masthead">
          <div className="masthead-inner">
            <Link href="/" className="brand" aria-label={t("layout.homeLabel")}>
              <span className="brand-devanagari">अलग</span>
              <span className="brand-latin">
                Alag
                <small>{t("layout.tagline")}</small>
              </span>
            </Link>
            <SiteNav />
            <LanguageSwitcher />
          </div>
        </header>

        <main id="main" className="page">
          {children}
        </main>

        <footer className="colophon">
          <div className="colophon-inner">
            <h2>{t("layout.colophonTitle")}</h2>
            <p>{t("layout.colophonBody")}</p>
            <ul className="src-list">
              <li>{t("layout.srcNational")}</li>
              <li>{t("layout.srcRank")}</li>
              <li>{t("layout.srcWaste")}</li>
              <li>{t("layout.srcComposition")}</li>
              <li>{t("layout.srcImpact")}</li>
              <li>{t("layout.srcDumpsites")}</li>
              <li>{t("layout.srcLookups")}</li>
            </ul>
            <p style={{ marginTop: 12 }}>
              {t("layout.colophonMeaning", { brand: "अलग" })}
            </p>
          </div>
        </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
