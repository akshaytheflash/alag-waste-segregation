import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

declare global {
  // eslint-disable-next-line no-var
  var __alag_db: Database.Database | undefined;
}

function getDb() {
  if (global.__alag_db) return global.__alag_db;
  // Vercel serverless has a read-only filesystem except /tmp.
  const dbPath =
    process.env.DATABASE_PATH ||
    (process.env.VERCEL ? "/tmp/alag.db" : "./data/alag.db");
  const abs = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const db = new Database(abs);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS bins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_name TEXT NOT NULL,
      house_no TEXT DEFAULT '',
      street TEXT DEFAULT '',
      pincode TEXT DEFAULT '',
      rwa TEXT DEFAULT 'Pilot RWA',
      ward_label TEXT DEFAULT 'Pilot-collected',
      phone TEXT DEFAULT '',
      language TEXT DEFAULT 'en',
      lat REAL,
      lng REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bin_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      day_offset INTEGER NOT NULL DEFAULT 0,
      wet_kg REAL DEFAULT 0,
      dry_kg REAL DEFAULT 0,
      mixed_kg REAL DEFAULT 0,
      hazardous_kg REAL DEFAULT 0,
      classification TEXT DEFAULT 'mixed',
      compliance INTEGER DEFAULT 0,
      photo_hash TEXT DEFAULT '',
      source TEXT DEFAULT 'manual',
      llm_note TEXT DEFAULT '',
      kabadi_requested INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (bin_id) REFERENCES bins(id)
    );
    CREATE TABLE IF NOT EXISTS pilot_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
  global.__alag_db = db;
  return db;
}

export function db() {
  return getDb();
}
