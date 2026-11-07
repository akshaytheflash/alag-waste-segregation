// Small disk + memory cache for upstream government / OSM calls.
// Vercel only allows writes under /tmp, so the cache lives there in production.
import fs from "fs";
import path from "path";

const CACHE_DIR = process.env.VERCEL
  ? "/tmp/alag-cache"
  : path.join(process.cwd(), ".cache");

const memory = new Map<string, { value: unknown; at: number }>();

function ensureDir() {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch {
    // Read-only filesystem — memory cache still works for this instance.
  }
}

export function cachePath(file: string) {
  ensureDir();
  return path.join(CACHE_DIR, file);
}

export function readCache<T>(file: string): { data: T; at: number } | null {
  const mem = memory.get(file);
  if (mem) return { data: mem.value as T, at: mem.at };
  try {
    const raw = fs.readFileSync(cachePath(file), "utf8");
    const parsed = JSON.parse(raw) as { at: number; data: T };
    if (!parsed || typeof parsed.at !== "number") return null;
    memory.set(file, { value: parsed.data, at: parsed.at });
    return { data: parsed.data, at: parsed.at };
  } catch {
    return null;
  }
}

export function writeCache<T>(file: string, data: T) {
  const at = Date.now();
  memory.set(file, { value: data, at });
  try {
    fs.writeFileSync(cachePath(file), JSON.stringify({ at, data }), "utf8");
  } catch {
    // Non-fatal.
  }
}

export function ageMinutes(at: number) {
  return Math.round((Date.now() - at) / 60000);
}

export function isoDay(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
