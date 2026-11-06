// BharatCode vision client — OpenAI-compatible /chat/completions
// Base: https://bharatcode.ai/api/model/v1, model qwen-3.8-27b
// Exponential backoff 2s, 4s, 8s on 503/5xx then deterministic fallback.
import { deterministicFallback } from "./fallback";

const BASE = process.env.BHARATCODE_BASE_URL || "https://bharatcode.ai/api/model/v1";
const MODEL = process.env.BHARATCODE_MODEL || "qwen-3.8-27b";
const KEY = process.env.BHARATCODE_API_KEY || "";

const PROMPT = `You classify household waste bin photos for Swachh Bharat segregation in India.
Categories: "wet" (food scraps, fruit peels, tea leaves), "dry" (plastic, paper, metal, glass, cardboard), "mixed" (wet+dry visible together), "hazardous" (batteries, bulbs, chemicals, sharps).
Reply with ONLY valid JSON: {"classification":"wet|dry|mixed|hazardous","confidence":0.0-1.0,"wet_kg":number,"dry_kg":number,"mixed_kg":number,"hazardous_kg":number,"note":"short 1-line summary"}
Estimate kg for a typical household bin (0-2 kg).`;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function classifyWithBharatCode(imageBuffer: Buffer, hint = "") {
  const started = Date.now();
  const delays = [0, 2000, 4000, 8000]; // 4 attempts with 2s/4s/8s backoff after first fail
  let lastError = "";

  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (attempt > 0) await sleep(delays[attempt]);
    try {
      const b64 = imageBuffer.toString("base64");
      const mime = "image/jpeg";
      const res = await fetch(`${BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: PROMPT + (hint ? `\nHint from collector: ${hint}` : "") },
                { type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } },
              ],
            },
          ],
          max_tokens: 300,
        }),
      });

      if (res.status === 503 || (res.status >= 500 && res.status < 600)) {
        lastError = `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`;
        continue;
      }
      if (!res.ok) {
        lastError = `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`;
        break;
      }

      const json = await res.json();
      const text: string =
        json?.choices?.[0]?.message?.content ||
        json?.choices?.[0]?.text ||
        "";
      // Extract JSON object robustly
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("No JSON in LLM reply");
      const parsed = JSON.parse(m[0]);
      const classification = ["wet", "dry", "mixed", "hazardous"].includes(parsed.classification)
        ? parsed.classification
        : "mixed";
      return {
        classification,
        confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.7,
        wet_kg: Number(parsed.wet_kg) || (classification === "wet" ? 1.2 : 0),
        dry_kg: Number(parsed.dry_kg) || (classification === "dry" ? 0.8 : 0),
        mixed_kg: Number(parsed.mixed_kg) || (classification === "mixed" ? 1.2 : 0),
        hazardous_kg: Number(parsed.hazardous_kg) || (classification === "hazardous" ? 0.2 : 0),
        note: String(parsed.note || "Classified by BharatCode vision LLM").slice(0, 220),
        source: "llm" as const,
        needsManualConfirm: false,
        latencyMs: Date.now() - started,
        attempts: attempt + 1,
      };
    } catch (e: any) {
      lastError = e?.message || "fetch failed";
      continue;
    }
  }

  // Graceful fallback after all retries
  const fb = deterministicFallback(imageBuffer, hint);
  return {
    ...fb,
    latencyMs: Date.now() - started,
    attempts: delays.length,
    fallbackReason: lastError || "LLM unavailable",
    llmDown: true,
  };
}
