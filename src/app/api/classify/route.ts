import { NextRequest, NextResponse } from "next/server";
import { classifyWithBharatCode } from "@/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("image") as File | null;
    const hint = String(form.get("hint") || "");
    if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Image too large (max 8MB)" }, { status: 413 });
    const buf = Buffer.from(await file.arrayBuffer());
    const result = await classifyWithBharatCode(buf, hint);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Classification failed" }, { status: 500 });
  }
}
