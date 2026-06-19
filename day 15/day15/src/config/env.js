import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    console.warn(`[ENV] WARNING: ${key} is not set.`);
  }
  return value;
}

export const env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  LLM_PROVIDER: process.env.LLM_PROVIDER || 'openai',

  OPENAI_API_KEY: requireEnv('OPENAI_API_KEY'),
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',

  GROQ_API_KEY: requireEnv('GROQ_API_KEY'),
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',

  ANTHROPIC_API_KEY: requireEnv('ANTHROPIC_API_KEY'),
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',

  DATABASE_PATH: process.env.DATABASE_PATH || './data/meetings.db',

  SLACK_WEBHOOK_URL: requireEnv('SLACK_WEBHOOK_URL'),
};
