"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import type { MessageKey } from "@/lib/i18n";

const LINKS: { href: string; long: MessageKey; short: MessageKey }[] = [
  { href: "/", long: "nav.fieldLong", short: "nav.fieldShort" },
  { href: "/dashboard", long: "nav.pilotLong", short: "nav.pilotShort" },
  { href: "/leaderboard", long: "nav.wardsLong", short: "nav.wardsShort" },
];

export default function SiteNav() {
  const path = usePathname();
  const { t } = useI18n();
  return (
    <nav className="site-nav" aria-label={t("nav.primary")}>
      {LINKS.map((l) => {
        const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>
            <span className="nav-long">{t(l.long)}</span>
            <span className="nav-short">{t(l.short)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
