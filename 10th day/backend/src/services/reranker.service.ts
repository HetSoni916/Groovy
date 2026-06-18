import { CohereClient } from 'cohere-ai';
import { Chunk } from '../types';
import { config } from '../config';

interface RerankOptions {
  topK?: number;
  model?: string;
}

interface RerankedResult {
  chunk: Chunk;
  score: number;
  originalRank: number;
}

export class RerankerService {
  private client: CohereClient | null = null;

  constructor() {
    const apiKey = process.env.COHERE_API_KEY || '';
    if (apiKey) {
      this.client = new CohereClient({ token: apiKey });
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async rerank(
    query: string,
    candidates: Chunk[],
    options: RerankOptions = {}
  ): Promise<RerankedResult[]> {
    const { topK = Math.min(3, candidates.length), model = 'rerank-english-v3.0' } = options;

    if (!this.client || candidates.length === 0) {
      return this.fallback(query, candidates, topK);
    }

    try {
      const docs = candidates.map(c => c.content);
      const response = await this.client.rerank({
        query,
        documents: docs,
        model,
        topN: topK,
      });

      return response.results.map(r => ({
        chunk: candidates[r.index],
        score: r.relevanceScore || 0,
        originalRank: r.index,
      }));
    } catch (err) {
      console.warn('Cohere reranker failed, falling back:', (err as Error).message);
      return this.fallback(query, candidates, topK);
    }
  }

  private fallback(query: string, candidates: Chunk[], topK: number): RerankedResult[] {
    const qLower = query.toLowerCase();
    const qTerms = qLower.split(/\s+/).filter(t => t.length > 2);
    const scored = candidates.map((chunk, i) => {
      const cLower = chunk.content.toLowerCase();
      let score = 0;
      for (const term of qTerms) {
        const matches = cLower.split(term).length - 1;
        score += matches;
      }
      if (cLower.includes(qLower)) score *= 2;
      return { chunk, score, originalRank: i };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}

export const rerankerService = new RerankerService();
