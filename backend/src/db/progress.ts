import { getDb } from './database.js';
import type { WatchProgress } from '../types/progress.js';

export function getProgress(episodeId: number): WatchProgress | undefined {
  return getDb()
    .prepare('SELECT * FROM watch_progress WHERE episode_id = ?')
    .get(episodeId) as WatchProgress | undefined;
}

export function upsertProgress(
  episodeId: number,
  positionSeconds: number,
  completed: number,
): void {
  getDb()
    .prepare(`
      INSERT INTO watch_progress (episode_id, position_seconds, completed, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(episode_id) DO UPDATE SET
        position_seconds = excluded.position_seconds,
        completed        = excluded.completed,
        updated_at       = excluded.updated_at
    `)
    .run(episodeId, positionSeconds, completed);
}
