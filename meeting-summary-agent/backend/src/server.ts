import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

app.listen(env.PORT, () => {
  logger.info('server.start', { port: env.PORT });
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});