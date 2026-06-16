import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  maxFileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10)) * 1024 * 1024,
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '30', 10),
  apiKeys: {
    groq: process.env.GROQ_API_KEY || '',
    gemini: process.env.GEMINI_API_KEY || '',
    cohere: process.env.COHERE_API_KEY || '',
  },
};
