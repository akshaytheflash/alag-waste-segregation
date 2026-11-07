import { NextRequest, NextResponse } from "next/server";
import {
  buildComplaint,
  findPortal,
  ISSUES,
  NATIONAL_FALLBACK,
  PORTALS,
} from "@/lib/grievance";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function payloadFrom(params: URLSearchParams | Record<string, any>) {
  const get = (key: string) =>
    params instanceof URLSearchParams
      ? params.get(key) || ""
      : String(params[key] ?? "");
  const city = get("city") || "Delhi";
  const state = get("state") || "Delhi";
  const portal = findPortal(city, state);
  const issueId = get("issue") || "mixed-collection";
  const issue = ISSUES.find((i) => i.id === issueId) || ISSUES[0];
  const lang = get("lang") === "hi" ? "hi" : "en";

  const complaint = buildComplaint({
    lang,
    body: portal?.body || NATIONAL_FALLBACK.body,
    city,
    state,
    pincode: get("pincode"),
    address: get("address"),
    issueEn: issue.en,
    details: get("details"),
    date: get("date") || new Date().toISOString().slice(0, 10),
    verdict: get("verdict"),
    ref: get("ref"),
    name: get("name"),
    phone: get("phone"),
  });

  return {
    ok: true,
    portal: portal
      ? {
          id: portal.id,
          city: portal.city,
          body: portal.body,
          url: portal.url,
          helpline: portal.helpline,
          scope: portal.scope,
        }
      : null,
    fallback: portal ? null : NATIONAL_FALLBACK,
    issue: { id: issue.id, en: issue.en, hi: issue.hi },
    lang,
    complaint,
    directory: PORTALS.map((p) => ({ city: p.city, body: p.body, url: p.url })),
  };
}

export async function GET(req: NextRequest) {
  return NextResponse.json(payloadFrom(req.nextUrl.searchParams));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json(payloadFrom(body || {}));
}
