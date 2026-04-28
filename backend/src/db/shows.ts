import { getDb } from './database.js';
import type { ShowSummary, ShowDetail, EpisodeRow } from '../types/show.js';

export function getAllShows(): ShowSummary[] {
    return getDb()
        .prepare(
            `
    SELECT s.id, s.title, s.year, s.poster_path,
           COUNT(e.id) AS episode_count
    FROM shows s
    LEFT JOIN episodes e ON e.show_id = s.id
    GROUP BY s.id
    ORDER BY s.title COLLATE NOCASE
  `,
        )
        .all() as ShowSummary[];
}

export function getShowById(id: number): ShowDetail | undefined {
    const db = getDb();

    const show = db
        .prepare('SELECT id, title, year, poster_path, description FROM shows WHERE id = ?')
        .get(id) as Omit<ShowDetail, 'episodes'> | undefined;

    if (!show) return undefined;

    const episodes = db
        .prepare(
            `
      SELECT e.id, e.season, e.episode, e.title, e.duration_seconds, e.mime_type, e.season_poster_path,
             wp.position_seconds, wp.completed, wp.updated_at AS progress_updated_at
      FROM episodes e
      LEFT JOIN watch_progress wp ON wp.episode_id = e.id
      WHERE e.show_id = ?
      ORDER BY e.season, e.episode
    `,
        )
        .all(id) as EpisodeRow[];

    return { ...show, episodes };
}
