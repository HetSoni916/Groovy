import { CodeChunk } from '../types';

export function countTokens(text: string): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/);
  return Math.ceil(words.length * 1.3);
}

export function truncateToTokens(text: string, maxTokens: number): string {
  const words = text.trim().split(/\s+/);
  const maxWords = Math.floor(maxTokens / 1.3);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ');
}

export function buildContextWindow(chunks: CodeChunk[], maxTokens: number): string {
  let context = '';
  let currentTokens = 0;

  for (const chunk of chunks) {
    const chunkTokens = chunk.tokenCount || countTokens(chunk.content);
    if (currentTokens + chunkTokens > maxTokens) {
      const remaining = maxTokens - currentTokens;
      if (remaining > 20) {
        context += '\n\n' + truncateToTokens(chunk.content, remaining);
      }
      break;
    }
    if (context) context += '\n\n';
    context += chunk.content;
    currentTokens += chunkTokens;
  }

  return context;
}
