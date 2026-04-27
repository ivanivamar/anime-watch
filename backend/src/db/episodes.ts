import { getDb } from './database.js';
import type { Episode } from '../types/episode.js';

export function getEpisodeById(id: number): Episode | undefined {
    return getDb().prepare('SELECT * FROM episodes WHERE id = ?').get(id) as Episode | undefined;
}

export function getNextEpisode(episodeId: number): Pick<Episode, 'id'> | undefined {
    return getDb()
        .prepare(
            `
      SELECT id FROM episodes
      WHERE show_id = (SELECT show_id FROM episodes WHERE id = ?)
        AND (season * 1000 + episode) > (
          SELECT season * 1000 + episode FROM episodes WHERE id = ?
        )
      ORDER BY season, episode
      LIMIT 1
    `,
        )
        .get(episodeId, episodeId) as Pick<Episode, 'id'> | undefined;
}
