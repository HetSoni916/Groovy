import { v4 as uuidv4 } from 'uuid';
import { Chunk, Page } from '../types';
import { countTokens } from '../utils/tokenizer';
import { config } from '../config';
import { storage } from '../utils/storage';

export class ChunkerService {
  chunkPages(documentId: string, pages: (Page & { documentId: string })[]): Chunk[] {
    const chunks: Chunk[] = [];

    for (const page of pages) {
      const pageChunks = this.splitPageIntoChunks(page, documentId);
      chunks.push(...pageChunks);
    }

    storage.saveChunks(chunks);
    return chunks;
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
