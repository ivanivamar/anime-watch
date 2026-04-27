import { Router, type Request, type Response } from 'express';
import { createReadStream, statSync } from 'fs';
import { getEpisodeById } from '../db/episodes.js';

export const streamRouter = Router();

streamRouter.get('/:episodeId', (req: Request, res: Response) => {
  const episodeId = parseInt(req.params['episodeId'] ?? '', 10);
  if (isNaN(episodeId)) {
    res.status(400).json({ error: 'Invalid episode ID' });
    return;
  }

  const episode = getEpisodeById(episodeId);
  if (!episode) {
    res.status(404).json({ error: 'Episode not found' });
    return;
  }

  let stat: ReturnType<typeof statSync>;
  try {
    stat = statSync(episode.file_path);
  } catch {
    res.status(404).json({ error: 'File not found on disk' });
    return;
  }

  const fileSize = stat.size;
  const rangeHeader = req.headers['range'];

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', episode.mime_type);

  if (!rangeHeader) {
    res.setHeader('Content-Length', fileSize);
    res.status(200);
    createReadStream(episode.file_path).pipe(res);
    return;
  }

  const match = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader);
  if (!match) {
    res.setHeader('Content-Range', `bytes */${fileSize}`);
    res.status(416).json({ error: 'Invalid Range header' });
    return;
  }

  const start = parseInt(match[1]!, 10);
  const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

  if (start >= fileSize || end >= fileSize || start > end) {
    res.setHeader('Content-Range', `bytes */${fileSize}`);
    res.status(416).json({ error: 'Range not satisfiable' });
    return;
  }

  const chunkSize = end - start + 1;
  res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
  res.setHeader('Content-Length', chunkSize);
  res.status(206);
  createReadStream(episode.file_path, { start, end }).pipe(res);
});
