import { Router, type Request, type Response } from 'express';
import { getProgress, upsertProgress } from '../db/progress.js';

export const progressRouter = Router();

progressRouter.get('/:episodeId', (req: Request, res: Response) => {
    const episodeId = parseInt(req.params['episodeId'] ?? '', 10);
    if (isNaN(episodeId)) {
        res.status(400).json({ error: 'Invalid episode ID' });
        return;
    }
    const progress = getProgress(episodeId);
    if (!progress) {
        res.status(404).json({ error: 'No progress found' });
        return;
    }
    res.json(progress);
});

progressRouter.post('/', (req: Request, res: Response) => {
    const { episodeId, position_seconds, completed } = req.body as {
        episodeId?: unknown;
        position_seconds?: unknown;
        completed?: unknown;
    };

    if (typeof episodeId !== 'number' || typeof position_seconds !== 'number') {
        res.status(400).json({ error: 'episodeId and position_seconds are required numbers' });
        return;
    }

    const completedVal = typeof completed === 'number' ? completed : 0;
    upsertProgress(episodeId, position_seconds, completedVal);
    res.status(204).end();
});
