/**
 * Inserts a test show + episode so you can hit /api/stream/1 with curl.
 *
 * Usage (run from backend/):
 *   npm run seed -- <path-to-any-video-or-file>
 *
 * Example:
 *   npm run seed -- "C:/media/anime/show/Season 01/S01E01 - Pilot.mkv"
 *
 * For quick testing without a real video you can point at any file:
 *   npm run seed -- package.json
 */
import 'dotenv/config';
import { resolve } from 'path';
import { existsSync } from 'fs';
import Database from 'better-sqlite3';

const filePath = process.argv[2];
if (!filePath) {
    console.error('Usage: npm run seed -- <path-to-file>');
    process.exit(1);
}

const absPath = resolve(filePath);
if (!existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
}

const ext = absPath.split('.').pop()?.toLowerCase();
const mimeMap: Record<string, string> = {
    mkv: 'video/x-matroska',
    mp4: 'video/mp4',
    webm: 'video/webm',
};
const mimeType = mimeMap[ext ?? ''] ?? 'application/octet-stream';

const dbPath = process.env['DB_PATH'] ?? './data/library.db';
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS shows (
    id INTEGER PRIMARY KEY, title TEXT NOT NULL, year INTEGER,
    poster_path TEXT, description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS episodes (
    id INTEGER PRIMARY KEY,
    show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    season INTEGER NOT NULL, episode INTEGER NOT NULL, title TEXT,
    file_path TEXT NOT NULL UNIQUE, duration_seconds INTEGER,
    mime_type TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(show_id, season, episode)
  );
  CREATE TABLE IF NOT EXISTS watch_progress (
    episode_id INTEGER PRIMARY KEY REFERENCES episodes(id) ON DELETE CASCADE,
    position_seconds INTEGER NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const showResult = db
    .prepare(`INSERT OR IGNORE INTO shows (title, year) VALUES ('Test Show', 2024)`)
    .run();

const showId =
    showResult.lastInsertRowid ||
    (db.prepare(`SELECT id FROM shows WHERE title = 'Test Show'`).get() as { id: number }).id;

db.prepare(
    `
  INSERT OR REPLACE INTO episodes (show_id, season, episode, title, file_path, mime_type)
  VALUES (?, 1, 1, 'Test Episode', ?, ?)
`,
).run(showId, absPath, mimeType);

const ep = db.prepare(`SELECT id FROM episodes WHERE file_path = ?`).get(absPath) as { id: number };

console.log(`\nSeeded episode id=${ep.id}`);
console.log(`File: ${absPath}\n`);
console.log(`Run these curl commands while the server is running:\n`);
console.log(`  # Full file — expect HTTP 200`);
console.log(`  curl -v http://localhost:3000/api/stream/${ep.id}\n`);
console.log(`  # First 1 KB — expect HTTP 206`);
console.log(`  curl -v -H "Range: bytes=0-1023" http://localhost:3000/api/stream/${ep.id}\n`);
console.log(`  # Open-ended range — expect HTTP 206`);
console.log(`  curl -v -H "Range: bytes=1000-" http://localhost:3000/api/stream/${ep.id}\n`);
console.log(`  # Out-of-bounds — expect HTTP 416`);
console.log(`  curl -v -H "Range: bytes=9999999999-" http://localhost:3000/api/stream/${ep.id}`);
