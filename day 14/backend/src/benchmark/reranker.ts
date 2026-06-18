import { Chunk } from '../types';

export interface RerankedChunk {
  chunk: Chunk;
  score: number;
}

export class RerankerService {
  private model: any = null;
  private pipeline: any = null;

  async initialize(): Promise<void> {
    try {
      const mod = await import('@xenova/transformers');
      this.pipeline = mod.pipeline;
      this.model = await this.pipeline('text-classification', 'Xenova/ms-marco-MiniLM-L-6-v2');
    } catch (err) {
      console.warn('Reranker model failed to load:', (err as Error).message);
      console.warn('Falling back to score-only reranking');
      this.model = null;
    }
  }

  async rerank(query: string, chunks: Chunk[], topK = 3): Promise<RerankedChunk[]> {
    if (!this.model) {
      return this.fallbackRerank(query, chunks, topK);
    }

    const pairs = chunks.map(c => ({ text: c.content, text_pair: query }));
    const inputs = pairs.map(p => ({ text: p.text, text_pair: p.text_pair }));

    const batchSize = 10;
    const allScores: number[] = [];

    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);
      try {
        const outputs = await this.model(batch);
        const scores = Array.isArray(outputs) ? outputs.map((o: any) => o.score) : [outputs.score];
        allScores.push(...scores);
      } catch {
        for (let j = 0; j < batch.length; j++) allScores.push(0);
      }
    }

    const scored: RerankedChunk[] = chunks.map((chunk, i) => ({
      chunk,
      score: allScores[i] || 0,
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  private fallbackRerank(query: string, chunks: Chunk[], topK: number): RerankedChunk[] {
    const qLower = query.toLowerCase();
    const qTerms = qLower.split(/\s+/).filter(t => t.length > 2);

    const scored: RerankedChunk[] = chunks.map(chunk => {
      const cLower = chunk.content.toLowerCase();
      let score = 0;
      for (const term of qTerms) {
        const regex = new RegExp(term, 'gi');
        const matches = cLower.match(regex);
        if (matches) score += matches.length;
      }
      if (cLower.includes(qLower)) score *= 2;
      return { chunk, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}

export const rerankerService = new RerankerService();
