import { getDb } from './database.js';
import type { ContinueWatchingItem, WatchProgress } from '../types/progress.js';

export function getProgress(episodeId: number): WatchProgress | undefined {
    return getDb().prepare('SELECT * FROM watch_progress WHERE episode_id = ?').get(episodeId) as
        | WatchProgress
        | undefined;
}

export function getContinueWatching(): ContinueWatchingItem[] {
    return getDb()
        .prepare(
            `
      SELECT
        wp.episode_id,
        e.season,
        e.episode,
        e.title         AS episode_title,
        e.duration_seconds,
        wp.position_seconds,
        s.id            AS show_id,
        s.title         AS show_title,
        wp.updated_at
      FROM watch_progress wp
      JOIN episodes e ON e.id = wp.episode_id
      JOIN shows   s ON s.id = e.show_id
      WHERE wp.completed = 0
        AND wp.position_seconds > 30
      ORDER BY wp.updated_at DESC
      LIMIT 10
    `,
        )
        .all() as ContinueWatchingItem[];
}

export function upsertProgress(
    episodeId: number,
    positionSeconds: number,
    completed: number,
): void {
    getDb()
        .prepare(
            `
      INSERT INTO watch_progress (episode_id, position_seconds, completed, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(episode_id) DO UPDATE SET
        position_seconds = excluded.position_seconds,
        completed        = excluded.completed,
        updated_at       = excluded.updated_at
    `,
        )
        .run(episodeId, positionSeconds, completed);
}
