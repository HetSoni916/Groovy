import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  SLACK_WEBHOOK_URL: z.string().optional().default(''),
  PORT: z.coerce.number().default(3001),
  DATABASE_PATH: z.string().default('./storage/meetings.db'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

export const env = envSchema.parse(process.env);