import app from './app';
import { config } from './config';

const port = config.port;

app.listen(port, () => {
  console.log(`Ask My Notes API running on http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
});
