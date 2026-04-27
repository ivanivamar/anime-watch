import { getDb } from './database.js';
import type { Episode } from '../types/episode.js';

export function getEpisodeById(id: number): Episode | undefined {
  return getDb()
    .prepare('SELECT * FROM episodes WHERE id = ?')
    .get(id) as Episode | undefined;
}
