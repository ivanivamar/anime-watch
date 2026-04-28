import { Router, type Request, type Response } from 'express';
import { getAllShows, getShowById } from '../db/shows.js';

export const showsRouter = Router();

showsRouter.get('/', (_req, res) => {
    res.json(getAllShows());
});

showsRouter.get('/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] ?? '', 10);
    if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid show ID' });
        return;
    }
    const show = getShowById(id);
    if (!show) {
        res.status(404).json({ error: 'Show not found' });
        return;
    }
    res.json(show);
});
