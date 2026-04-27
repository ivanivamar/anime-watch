import 'dotenv/config';
import express from 'express';
import { initDb } from './db/database.js';
import { errorMiddleware } from './middleware/error.js';
import { streamRouter } from './routes/stream.js';

const app = express();
const port = process.env['PORT'] ?? 3000;

app.use(express.json());

initDb();

app.use('/api/stream', streamRouter);

app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
