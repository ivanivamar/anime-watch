import 'dotenv/config';
import express from 'express';
import { initDb } from './db/database.js';
import { errorMiddleware } from './middleware/error.js';
import { episodesRouter } from './routes/episodes.js';
import { progressRouter } from './routes/progress.js';
import { showsRouter } from './routes/shows.js';
import { streamRouter } from './routes/stream.js';
import { thumbnailRouter } from './routes/thumbnail.js';

const app = express();
const port = process.env['PORT'] ?? 3000;

app.use(express.json());

initDb();

app.use('/api/shows', showsRouter);
app.use('/api/episodes', episodesRouter);
app.use('/api/stream', streamRouter);
app.use('/api/progress', progressRouter);
app.use('/api/thumbnail', thumbnailRouter);

app.use(errorMiddleware);

app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
});
