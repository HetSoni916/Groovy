import app from './app';
import { config } from './config';
import { initDb } from './services/database';

const port = config.port;

async function start() {
  await initDb();
  app.listen(port, () => {
    console.log(`CodeBase Explainer API running on http://localhost:${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
  });
}

start().catch(e => {
  console.error('Failed to start:', e);
  process.exit(1);
});
