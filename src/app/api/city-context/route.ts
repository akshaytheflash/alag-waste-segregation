import { NextRequest, NextResponse } from "next/server";
import {
  loadRankFeed,
  loadSwmFeed,
  matchRank,
  matchSwm,
  NATIONAL_CONTEXT,
} from "@/lib/swachh";
import { readCache, writeCache } from "@/lib/cache";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PincodeInfo = {
  district: string;
  state: string;
  offices?: Array<{ name: string; branch: string }>;
};

async function lookupPincode(pincode: string): Promise<PincodeInfo | null> {
  const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`India Post HTTP ${res.status}`);
  const data = await res.json();
  const first = data?.[0];
  if (!first || first.Status !== "Success" || !first.PostOffice?.length) return null;
  const po = first.PostOffice[0];
  return {
    district: po.District,
    state: po.State,
    offices: first.PostOffice.slice(0, 4).map((o: any) => ({ name: o.Name, branch: o.BranchType })),
  };
}

export async function GET(req: NextRequest) {
  const pincode = (req.nextUrl.searchParams.get("pincode") || "110001").trim();
  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json(
      { ok: false, error: "Enter a 6-digit Indian PIN code." },
      { status: 400 }
    );
  }

  const cached = readCache<any>(`city-context-${pincode}.json`);
  if (cached && Date.now() - cached.at < 6 * 60 * 60 * 1000) {
    return NextResponse.json({ ...cached.data, cached: true });
  }

  let pin: PincodeInfo | null = null;
  let pinError: string | null = null;
  try {
    pin = await lookupPincode(pincode);
    if (!pin) {
      return NextResponse.json(
        { ok: false, error: `PIN ${pincode} was not found in the India Post directory.` },
        { status: 404 }
      );
    }
  } catch (e: any) {
    pinError = e?.message || "India Post unreachable";
    return NextResponse.json(
      {
        ok: false,
        error: "India Post is unreachable, so the city cannot be resolved. Retry.",
        detail: pinError,
      },
      { status: 502 }
    );
  }

  const [rankFeed, swmFeed] = await Promise.all([loadRankFeed(), loadSwmFeed()]);
  const match = matchRank(pin.district, pin.state, pincode, rankFeed.rows);
  const swm = matchSwm(pin.district, swmFeed.rows);

  const payload = {
    ok: true,
    pincode,
    district: pin.district,
    state: pin.state,
    city: match.matchedBy || pin.district,
    rank: match.row,
    rankNote: match.note,
    rankAlternatives: match.alternatives || [],
    solidWaste: swm,
    solidWasteNote: swm
      ? ""
      : `data.gov.in has no solid-waste row published for ${pin.district} in the ULB returns.`,
    feeds: {
      rankLive: rankFeed.live,
      rankFetchedAt: rankFeed.fetchedAt,
      rankError: rankFeed.error,
      rankSourceUrl: rankFeed.sourceUrl,
      swmLive: swmFeed.live,
      swmFetchedAt: swmFeed.fetchedAt,
      swmError: swmFeed.error,
      swmSourceUrl: swmFeed.sourceUrl,
    },
    national: NATIONAL_CONTEXT,
    fetchedAt: new Date().toISOString(),
  };

  writeCache(`city-context-${pincode}.json`, payload);
  return NextResponse.json({ ...payload, cached: false });
}
