import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Router, type Request, type Response } from 'express';
import { getDb } from '../db/database.js';

const THUMBNAILS_DIR = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    'data',
    'thumbnails',
);

export const thumbnailRouter = Router();

// Must be before /:episodeId so "show" isn't parsed as an episode ID
thumbnailRouter.get('/show/:showId', (req: Request, res: Response) => {
    const showId = parseInt(req.params['showId'] ?? '', 10);
    if (isNaN(showId)) {
        res.status(400).json({ error: 'Invalid show ID' });
        return;
    }
    const row = getDb().prepare('SELECT poster_path FROM shows WHERE id = ?').get(showId) as
        | { poster_path: string | null }
        | undefined;
    if (!row || !row.poster_path || !existsSync(row.poster_path)) {
        res.status(404).json({ error: 'Poster not found' });
        return;
    }
    res.sendFile(row.poster_path);
});

thumbnailRouter.get('/season/:showId/:season', (req: Request, res: Response) => {
    const showId = parseInt(req.params['showId'] ?? '', 10);
    const season = parseInt(req.params['season'] ?? '', 10);
    if (isNaN(showId) || isNaN(season)) {
        res.status(400).json({ error: 'Invalid parameters' });
        return;
    }
    const row = getDb()
        .prepare(
            'SELECT season_poster_path FROM episodes WHERE show_id = ? AND season = ? AND season_poster_path IS NOT NULL LIMIT 1',
        )
        .get(showId, season) as { season_poster_path: string } | undefined;

    if (!row || !existsSync(row.season_poster_path)) {
        res.status(404).json({ error: 'Season poster not found' });
        return;
    }
    res.sendFile(row.season_poster_path);
});

thumbnailRouter.get('/:episodeId', (req: Request, res: Response) => {
    const episodeId = parseInt(req.params['episodeId'] ?? '', 10);
    if (isNaN(episodeId)) {
        res.status(400).json({ error: 'Invalid episode ID' });
        return;
    }
    const thumbPath = join(THUMBNAILS_DIR, `${episodeId}.jpg`);
    if (!existsSync(thumbPath)) {
        res.status(404).json({ error: 'Thumbnail not found' });
        return;
    }
    res.sendFile(thumbPath);
});
