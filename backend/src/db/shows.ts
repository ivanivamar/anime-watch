import { getDb } from './database.js';
import type { ShowSummary } from '../types/show.js';

export function getAllShows(): ShowSummary[] {
  return getDb().prepare(`
    SELECT s.id, s.title, s.year, s.poster_path,
           COUNT(e.id) AS episode_count
    FROM shows s
    LEFT JOIN episodes e ON e.show_id = s.id
    GROUP BY s.id
    ORDER BY s.title COLLATE NOCASE
  `).all() as ShowSummary[];
}
