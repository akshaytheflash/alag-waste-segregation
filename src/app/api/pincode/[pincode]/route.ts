import { NextRequest, NextResponse } from "next/server";

// Live proxy to India Post pincode API — https://api.postalpincode.in/pincode/{pincode}
// Never mocked. On failure returns honest error + retry hint.
export async function GET(_req: NextRequest, { params }: { params: { pincode: string } }) {
  const { pincode } = params;
  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ error: "Invalid pincode. Enter a 6-digit Indian pincode." }, { status: 400 });
  }
  try {
    // NOTE: api.postalpincode.in resets connections unless the UA is a plain
    // browser UA (verified 2026-11-06: default UA=>200, any "Alag-.../1.0"
    // suffix=>connection reset 000). Use plain Mozilla/5.0 here.
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Upstream ${res.status}`);
    const data = await res.json();
    const first = data?.[0];
    if (!first || first.Status !== "Success" || !first.PostOffice?.length) {
      return NextResponse.json({ error: "Pincode not found. Check the number and retry.", pincode }, { status: 404 });
    }
    const po = first.PostOffice[0];
    return NextResponse.json({
      pincode,
      district: po.District,
      state: po.State,
      circle: po.Circle,
      delivery: po.DeliveryStatus,
      offices: first.PostOffice.slice(0, 8).map((o: any) => ({ name: o.Name, branch: o.BranchType })),
      source: "https://api.postalpincode.in/pincode/" + pincode,
    });
  } catch (e: any) {
    return NextResponse.json({ error: "India Post API is unreachable. Retry in a moment.", detail: e?.message }, { status: 502 });
  }
}
