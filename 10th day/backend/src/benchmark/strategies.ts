import { v4 as uuidv4 } from 'uuid';
import { Chunk, Page } from '../types';
import { countTokens } from '../utils/tokenizer';
import { embeddingService } from '../services/embedding.service';

interface StrategyResult {
  name: string;
  chunks: Chunk[];
  timeMs: number;
  stats: { totalChunks: number; avgTokens: number; minTokens: number; maxTokens: number };
}

function tokenLen(text: string): number {
  return countTokens(text);
}

function makeChunk(docId: string, start: number, end: number, content: string): Chunk {
  return {
    id: uuidv4(),
    documentId: docId,
    pageStart: start,
    pageEnd: end,
    content,
    tokenCount: tokenLen(content),
  };
}

export function fixedSizeChunking(
  pages: (Page & { documentId: string })[],
  chunkSize = 500,
  overlap = 50
): StrategyResult {
  const start = Date.now();
  const chunks: Chunk[] = [];

  const rawTexts = pages.filter(p => p.text.trim()).map(p => ({
    docId: p.documentId, page: p.pageNumber, text: p.text,
  }));
  if (rawTexts.length === 0) {
    return { name: 'Fixed-Size', chunks: [], timeMs: 0, stats: { totalChunks: 0, avgTokens: 0, minTokens: 0, maxTokens: 0 } };
  }

  const docId = rawTexts[0].docId;
  const firstPage = rawTexts[0].page;
  const fullText = rawTexts.map(r => r.text).join('\n\n');
  const words = fullText.split(/\s+/);
  const stride = chunkSize - overlap;

  for (let startIdx = 0; startIdx < words.length; startIdx += stride) {
    const slice = words.slice(startIdx, startIdx + chunkSize);
    if (slice.length === 0) break;
    chunks.push(makeChunk(docId, firstPage, firstPage, slice.join(' ')));
  }

  const stats = calcStats(chunks);
  return { name: 'Fixed-Size', chunks, timeMs: Date.now() - start, stats };
}

async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const result: number[][] = [];
  for (const t of texts) {
    try {
      const emb = await embeddingService.generateEmbedding(t);
      result.push(emb);
    } catch {
      result.push([]);
    }
  }
  return result;
}

function cosineSim(a: number[], b: number[]): number {
  if (!a.length || !b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

function splitSentences(text: string): string[] {
  const raw = text.split(/(?<=[.!?])\s+/);
  return raw.map(s => s.trim()).filter(s => s.length > 0);
}

export async function semanticChunking(
  pages: (Page & { documentId: string })[],
  threshold = 0.7,
  minChunkTokens = 100,
  maxChunkTokens = 500
): Promise<StrategyResult> {
  const start = Date.now();
  const chunks: Chunk[] = [];
  const rawTexts: { docId: string; page: number; text: string }[] = [];
  for (const p of pages) {
    if (p.text.trim()) rawTexts.push({ docId: p.documentId, page: p.pageNumber, text: p.text });
  }
  const fullText = rawTexts.map(r => r.text).join('\n\n');
  const docId = rawTexts[0]?.docId || 'unknown';
  const page = rawTexts[0]?.page || 1;

  const sentences = splitSentences(fullText);
  if (sentences.length <= 1) {
    chunks.push(makeChunk(docId, page, page, fullText));
    const stats = calcStats(chunks);
    return { name: 'Semantic', chunks, timeMs: Date.now() - start, stats };
  }

  const embeddings = await getEmbeddings(sentences);
  const groups: string[][] = [];
  let current: string[] = [sentences[0]];
  let currentTokens = tokenLen(sentences[0]);

  for (let i = 1; i < sentences.length; i++) {
    const prevEmb = embeddings[i - 1];
    const curEmb = embeddings[i];
    const sim = cosineSim(prevEmb, curEmb);
    const sentTokens = tokenLen(sentences[i]);

    if (sim < threshold && currentTokens + sentTokens <= maxChunkTokens && currentTokens >= minChunkTokens) {
      groups.push(current);
      current = [sentences[i]];
      currentTokens = sentTokens;
    } else {
      current.push(sentences[i]);
      currentTokens += sentTokens;
      if (currentTokens >= maxChunkTokens) {
        groups.push(current);
        current = [];
        currentTokens = 0;
      }
    }
  }
  if (current.length > 0) groups.push(current);

  for (const g of groups) {
    const content = g.join(' ').trim();
    if (content) chunks.push(makeChunk(docId, page, page, content));
  }

  const stats = calcStats(chunks);
  return { name: 'Semantic', chunks, timeMs: Date.now() - start, stats };
}

export function slidingWindowChunking(
  pages: (Page & { documentId: string })[],
  windowSize = 500,
  stride = 100
): StrategyResult {
  const start = Date.now();
  const chunks: Chunk[] = [];
  const rawTexts: { docId: string; page: number; text: string }[] = [];
  for (const p of pages) {
    if (p.text.trim()) rawTexts.push({ docId: p.documentId, page: p.pageNumber, text: p.text });
  }
  const fullText = rawTexts.map(r => r.text).join('\n\n');
  const docId = rawTexts[0]?.docId || 'unknown';
  const page = rawTexts[0]?.page || 1;

  const words = fullText.split(/\s+/);
  let pos = 0;
  while (pos < words.length) {
    const slice = words.slice(pos, pos + windowSize);
    if (slice.length === 0) break;
    chunks.push(makeChunk(docId, page, page, slice.join(' ')));
    pos += stride;
  }

  const stats = calcStats(chunks);
  return { name: 'Sliding Window', chunks, timeMs: Date.now() - start, stats };
}

export function hierarchicalChunking(
  pages: (Page & { documentId: string })[],
  leafSize = 100,
  parentSize = 500
): StrategyResult {
  const start = Date.now();
  const rawTexts: { docId: string; page: number; text: string }[] = [];
  for (const p of pages) {
    if (p.text.trim()) rawTexts.push({ docId: p.documentId, page: p.pageNumber, text: p.text });
  }
  const fullText = rawTexts.map(r => r.text).join('\n\n');
  const docId = rawTexts[0]?.docId || 'unknown';
  const page = rawTexts[0]?.page || 1;
  const words = fullText.split(/\s+/);

  const leaves: Chunk[] = [];
  for (let i = 0; i < words.length; i += leafSize) {
    const slice = words.slice(i, i + leafSize);
    if (slice.length > 0) leaves.push(makeChunk(docId, page, page, slice.join(' ')));
  }

  const parents: Chunk[] = [];
  for (let i = 0; i < leaves.length; i += Math.ceil(parentSize / leafSize)) {
    const parentText = leaves.slice(i, i + Math.ceil(parentSize / leafSize)).map(l => l.content).join(' ');
    parents.push(makeChunk(docId, page, page, parentText));
  }

  const all = [...parents, ...leaves];
  const stats = calcStats(all);
  return { name: 'Hierarchical', chunks: all, timeMs: Date.now() - start, stats };
}

function calcStats(chunks: Chunk[]) {
  const tokens = chunks.map(c => c.tokenCount);
  return {
    totalChunks: chunks.length,
    avgTokens: tokens.length ? Math.round(tokens.reduce((a, b) => a + b, 0) / tokens.length) : 0,
    minTokens: tokens.length ? Math.min(...tokens) : 0,
    maxTokens: tokens.length ? Math.max(...tokens) : 0,
  };
}
