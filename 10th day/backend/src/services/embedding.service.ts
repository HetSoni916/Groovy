import { pipeline } from '@xenova/transformers';

export class EmbeddingService {
  private extractor: any = null;
  private initPromise: Promise<void> | null = null;

  private async getExtractor(): Promise<any> {
    if (!this.extractor) {
      if (!this.initPromise) {
        this.initPromise = (async () => {
          this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        })();
      }
      await this.initPromise;
    }
    return this.extractor;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0];
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const validTexts = texts.map(t => t.replace(/\0/g, '').trim()).filter(t => t.length > 0);
    if (validTexts.length === 0) return texts.map(() => []);

    const extractor = await this.getExtractor();
    const results: number[][] = [];

    for (const text of validTexts) {
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      results.push(Array.from(output.data));
    }

    return results;
  }
}

export const embeddingService = new EmbeddingService();
