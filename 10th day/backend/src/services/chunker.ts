import { v4 as uuidv4 } from 'uuid';
import { Chunk, Page } from '../types';
import { countTokens } from '../utils/tokenizer';
import { config } from '../config';
import { storage } from '../utils/storage';
import { embeddingService } from './embedding.service';
import { vectorStore } from './vectorStore';

export class ChunkerService {
  async chunkPages(documentId: string, pages: (Page & { documentId: string })[]): Promise<Chunk[]> {
    const chunks: Chunk[] = [];

    for (const page of pages) {
      const pageChunks = this.splitPageIntoChunks(page, documentId);
      chunks.push(...pageChunks);
    }

    await this.generateEmbeddings(chunks);
    storage.saveChunks(chunks);

    const docs = storage.getDocuments();
    const filenames = new Map(docs.map(d => [d.id, d.filename]));
    await vectorStore.addChunks(chunks, documentId, filenames);

    return chunks;
  }

  private async generateEmbeddings(chunks: Chunk[]): Promise<void> {
    const contents = chunks.map(c => c.content);
    try {
      const embeddings = await embeddingService.generateEmbeddings(contents);
      for (let i = 0; i < chunks.length; i++) {
        if (embeddings[i] && embeddings[i].length > 0) {
          chunks[i].embedding = embeddings[i];
        }
      }
    } catch (err) {
      console.warn('Embedding generation failed, falling back to TF-IDF:', (err as Error).message);
    }
  }

  private splitPageIntoChunks(page: Page & { documentId: string }, documentId: string): Chunk[] {
    const chunks: Chunk[] = [];
    const paragraphs = page.text.split(/\n\s*\n/);
    let currentChunk = '';
    let currentTokens = 0;
    let currentStart = page.pageNumber;

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (!trimmed) continue;

      const paraTokens = countTokens(trimmed);

      if (currentTokens + paraTokens > config.chunkTokenLimit && currentChunk) {
        chunks.push(this.createChunk(documentId, currentStart, page.pageNumber, currentChunk));
        currentChunk = '';
        currentTokens = 0;
        currentStart = page.pageNumber;
      }

      if (currentChunk) currentChunk += '\n\n';
      currentChunk += trimmed;
      currentTokens += paraTokens;
    }

    if (currentChunk) {
      chunks.push(this.createChunk(documentId, currentStart, page.pageNumber, currentChunk));
    }

    return chunks;
  }

  private createChunk(documentId: string, pageStart: number, pageEnd: number, content: string): Chunk {
    return {
      id: uuidv4(),
      documentId,
      pageStart,
      pageEnd,
      content,
      tokenCount: countTokens(content),
    };
  }

  getChunksForQuery(documentIds?: string[]): Chunk[] {
    const allChunks = storage.getChunks();
    if (!documentIds || documentIds.length === 0) return allChunks;
    return allChunks.filter(c => documentIds.includes(c.documentId));
  }
}

export const chunkerService = new ChunkerService();
