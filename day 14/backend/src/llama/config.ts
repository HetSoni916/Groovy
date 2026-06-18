import { config as appConfig } from '../config';

export const llamaConfig = {
  llmProvider: (process.env.LLM_PROVIDER || 'ollama').toLowerCase(),
  groqApiKey: appConfig.groqApiKey,
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2:3b',
  temperature: 0.3,
  maxTokens: 4096,
  agentMaxIterations: 10,
  agentVerbose: process.env.AGENT_VERBOSE === 'true',
};
