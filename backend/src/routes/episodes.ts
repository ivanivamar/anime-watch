import { Router, type Request, type Response } from 'express';
import { getEpisodeById, getNextEpisode } from '../db/episodes.js';

export const episodesRouter = Router();

episodesRouter.get('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params['id'] ?? '', 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid episode ID' });
    return;
  }
  const episode = getEpisodeById(id);
  if (!episode) {
    res.status(404).json({ error: 'Episode not found' });
    return;
  }
  res.json(episode);
});

episodesRouter.get('/:id/next', (req: Request, res: Response) => {
  const id = parseInt(req.params['id'] ?? '', 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid episode ID' });
    return;
  }
  const next = getNextEpisode(id);
  // Return null (not 404) so the client knows "no next episode" vs "error"
  res.json(next ?? null);
});
