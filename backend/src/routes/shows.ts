import { Router } from 'express';
import { getAllShows } from '../db/shows.js';

export const showsRouter = Router();

showsRouter.get('/', (_req, res) => {
  res.json(getAllShows());
});
