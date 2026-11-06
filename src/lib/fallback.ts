// Deterministic fallback classifier — always returns the same shape.
// Honest: when the LLM is unavailable we do NOT pretend to see the image.
// We return "uncertain/mixed" with compliance=0 and require one-tap manual
// confirmation in the collector UI. Demo never crashes.
import crypto from "crypto";

export type Classification = "wet" | "dry" | "mixed" | "hazardous";

export function deterministicFallback(
  imageBuffer: Buffer,
  hint: string = ""
): {
  classification: Classification;
  confidence: number;
  wet_kg: number;
  dry_kg: number;
  mixed_kg: number;
  hazardous_kg: number;
  note: string;
  source: "fallback";
  needsManualConfirm: boolean;
} {
  const hash = crypto.createHash("sha256").update(imageBuffer).digest("hex").slice(0, 12);
  const lowerHint = hint.toLowerCase();
  // Keyword hints stored in filename/description can steer the fallback
  // deterministically; otherwise default to mixed (non-compliant) which is safe.
  let classification: Classification = "mixed";
  if (lowerHint.includes("wet") || lowerHint.includes("geela") || lowerHint.includes("गीला")) classification = "wet";
  else if (lowerHint.includes("dry") || lowerHint.includes("sookha") || lowerHint.includes("सूखा")) classification = "dry";
  else if (lowerHint.includes("hazard")) classification = "hazardous";

  return {
    classification,
    confidence: 0.25,
    wet_kg: classification === "wet" ? 1.2 : 0,
    dry_kg: classification === "dry" ? 0.8 : 0,
    mixed_kg: classification === "mixed" ? 1.5 : 0,
    hazardous_kg: classification === "hazardous" ? 0.3 : 0,
    note: `Deterministic fallback (LLM unavailable, photo hash ${hash}). Manual one-tap confirmation required.`,
    source: "fallback",
    needsManualConfirm: true,
  };
}
