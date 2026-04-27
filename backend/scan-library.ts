/**
 * Library scanner — walks MEDIA_ROOT and syncs shows/episodes into the DB.
 *
 * Lives in backend/ (not /scripts/) because it imports backend node_modules.
 * ESM resolves bare specifiers relative to the script file, so the packages
 * must be reachable from here.
 *
 * Usage (run from backend/):
 *   npm run scan
 *
 * Expected media layout:
 *   MEDIA_ROOT/
 *     Show Name (Year)/
 *       Season 01/
 *         S01E01 - Episode Title.mkv
 */
import 'dotenv/config';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { initDb, getDb } from './src/db/database.js';

// ── regex patterns ────────────────────────────────────────────────────────────

const SHOW_RE = /^(.+)\s+\((\d{4})\)$/;
const SEASON_RE = /^Season\s+(\d+)$/i;
const EPISODE_RE = /^S(\d+)E(\d+)\s+-\s+(.+)\.(mkv|mp4|webm)$/i;

const MIME: Record<string, string> = {
  mkv: 'video/x-matroska',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

// ── ffprobe helper ────────────────────────────────────────────────────────────

function probeDuration(filePath: string): Promise<number | null> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err || data.format.duration == null) {
        resolve(null);
      } else {
        resolve(Math.round(data.format.duration));
      }
    });
  });
}

// ── types ─────────────────────────────────────────────────────────────────────

interface ShowRow {
  id: number;
}

interface EpisodeRow {
  id: number;
}

// ── scanner ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const mediaRoot = process.env['MEDIA_ROOT'];
  if (!mediaRoot) {
    console.error('MEDIA_ROOT is not set. Add it to backend/.env');
    process.exit(1);
  }

  initDb();
  const db = getDb();

  let showsSeen = 0;
  let added = 0;
  let updated = 0;
  let skipped = 0;

  let showEntries: string[];
  try {
    showEntries = readdirSync(mediaRoot);
  } catch {
    console.error(`Cannot read MEDIA_ROOT: ${mediaRoot}`);
    process.exit(1);
  }

  for (const showEntry of showEntries) {
    const showDir = join(mediaRoot, showEntry);

    let isDir = false;
    try { isDir = statSync(showDir).isDirectory(); } catch { /* skip */ }
    if (!isDir) continue;

    const showMatch = SHOW_RE.exec(showEntry);
    if (!showMatch) {
      console.warn(`[skip] "${showEntry}" — doesn't match "Show Name (Year)"`);
      skipped++;
      continue;
    }

    const title = showMatch[1]!.trim();
    const year = parseInt(showMatch[2]!, 10);
    showsSeen++;
    console.log(`\nShow: ${title} (${year})`);

    // SELECT first — shows has no UNIQUE(title,year) constraint so INSERT OR IGNORE won't deduplicate
    let show = db
      .prepare(`SELECT id FROM shows WHERE title = ? AND year = ?`)
      .get(title, year) as ShowRow | undefined;
    if (!show) {
      db.prepare(`INSERT INTO shows (title, year) VALUES (?, ?)`).run(title, year);
      show = db
        .prepare(`SELECT id FROM shows WHERE title = ? AND year = ?`)
        .get(title, year) as ShowRow;
    }

    for (const seasonEntry of readdirSync(showDir)) {
      const seasonDir = join(showDir, seasonEntry);

      let seasonIsDir = false;
      try { seasonIsDir = statSync(seasonDir).isDirectory(); } catch { /* skip */ }
      if (!seasonIsDir) continue;

      const seasonMatch = SEASON_RE.exec(seasonEntry);
      if (!seasonMatch) {
        console.warn(`  [skip] "${seasonEntry}" — doesn't match "Season XX"`);
        skipped++;
        continue;
      }

      const season = parseInt(seasonMatch[1]!, 10);

      for (const episodeFile of readdirSync(seasonDir)) {
        const epMatch = EPISODE_RE.exec(episodeFile);
        if (!epMatch) {
          console.warn(`  [skip] "${episodeFile}" — doesn't match "SXXEXX - Title.ext"`);
          skipped++;
          continue;
        }

        const epSeason = parseInt(epMatch[1]!, 10);
        const epNumber = parseInt(epMatch[2]!, 10);
        const epTitle = epMatch[3]!.trim();
        const ext = epMatch[4]!.toLowerCase();
        const mimeType = MIME[ext]!;
        const filePath = join(seasonDir, episodeFile);

        if (epSeason !== season) {
          console.warn(`  [skip] S${epSeason}E${epNumber} is inside Season ${season} folder — skipping`);
          skipped++;
          continue;
        }

        process.stdout.write(`  S${String(epSeason).padStart(2, '0')}E${String(epNumber).padStart(2, '0')} "${epTitle}" — probing...`);
        const duration = await probeDuration(filePath);
        process.stdout.write(duration != null ? ` ${duration}s\n` : ' (no duration)\n');

        const existing = db
          .prepare(`SELECT id FROM episodes WHERE show_id = ? AND season = ? AND episode = ?`)
          .get(show.id, epSeason, epNumber) as EpisodeRow | undefined;

        if (!existing) {
          db.prepare(`
            INSERT INTO episodes (show_id, season, episode, title, file_path, duration_seconds, mime_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(show.id, epSeason, epNumber, epTitle, filePath, duration, mimeType);
          added++;
        } else {
          db.prepare(`
            UPDATE episodes
            SET title = ?, file_path = ?, duration_seconds = ?, mime_type = ?
            WHERE id = ?
          `).run(epTitle, filePath, duration, mimeType, existing.id);
          updated++;
        }
      }
    }
  }

  console.log(`
────────────────────────────────────────
Scan complete
  Shows found : ${showsSeen}
  Episodes    : ${added} added, ${updated} updated, ${skipped} skipped
────────────────────────────────────────`);
}

main().catch((err: unknown) => {
  console.error('Scanner failed:', err);
  process.exit(1);
});
