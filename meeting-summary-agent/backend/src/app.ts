import cors from 'cors';
import express from 'express';
import path from 'path';
import routes from './routes';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.use(errorHandler);

export default app;