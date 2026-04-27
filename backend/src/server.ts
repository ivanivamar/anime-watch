import 'dotenv/config';
import express from 'express';
import { errorMiddleware } from './middleware/error.js';

const app = express();
const port = process.env['PORT'] ?? 3000;

app.use(express.json());

// Routes will be registered here as features are built
// e.g. app.use('/api/shows', showsRouter);

app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
