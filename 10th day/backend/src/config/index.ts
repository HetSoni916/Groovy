import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  maxFileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10)) * 1024 * 1024,
  groqApiKey: process.env.GROQ_API_KEY || '',
  storageDir: path.resolve(__dirname, '../../storage'),
  maxContextTokens: 8000,
  systemPromptBudget: 0.10,
  contextBudget: 0.80,
  questionBudget: 0.10,
  chunkTokenLimit: 500,
  maxChunksSelected: 3,
  embeddingModel: process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2',
  useReranker: process.env.USE_RERANKER === 'true',
  rerankerTopK: parseInt(process.env.RERANKER_TOP_K || '3', 10),
  rerankerFirstPassK: parseInt(process.env.RERANKER_FIRST_PASS_K || '10', 10),
};
