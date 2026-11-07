"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", long: "Field tool", short: "Field" },
  { href: "/dashboard", long: "Pilot ledger", short: "Pilot" },
  { href: "/leaderboard", long: "Ward register", short: "Wards" },
];

export default function SiteNav() {
  const path = usePathname();
  return (
    <nav className="site-nav" aria-label="Primary">
      {LINKS.map((l) => {
        const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>
            <span className="nav-long">{l.long}</span>
            <span className="nav-short">{l.short}</span>
          </Link>
        );
      })}
    </nav>
  );
}
