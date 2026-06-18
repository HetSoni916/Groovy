import * as path from 'path';
import * as fs from 'fs';
import { Page, Chunk } from '../types';
import { countTokens } from '../utils/tokenizer';
import { fixedSizeChunking, semanticChunking, slidingWindowChunking, hierarchicalChunking } from './strategies';
import { rerankerService } from './reranker';

const STORAGE_DIR = path.resolve(__dirname, '../../storage');

interface BenchmarkResult {
  strategy: string;
  chunkTimeMs: number;
  totalChunks: number;
  avgTokens: number;
  minTokens: number;
  maxTokens: number;
  retrievalResults: RetrievalResult[];
  retrievalAvgRecall: number;
  retrievalLatencyMs: number;
}

interface RetrievalResult {
  query: string;
  expectedTerms: string[];
  topChunks: { snippet: string; score: number }[];
  recall: number;
  precision: number;
  latencyMs: number;
}

function loadPages(): (Page & { documentId: string })[] {
  const raw = fs.readFileSync(path.join(STORAGE_DIR, 'pages.json'), 'utf-8');
  const pages: (Page & { documentId: string })[] = JSON.parse(raw);
  return pages.filter(p => p.text.trim().length > 0);
}

function loadDocuments(): { id: string; filename: string }[] {
  const raw = fs.readFileSync(path.join(STORAGE_DIR, 'documents.json'), 'utf-8');
  return JSON.parse(raw);
}

function extractTerms(text: string): string[] {
  const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const tokens = cleaned.split(/\s+/).filter(t => t.length > 2);
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'not', 'but', 'had', 'has', 'was',
    'all', 'can', 'each', 'any', 'how', 'why', 'what', 'which',
    'who', 'whom', 'this', 'that', 'these', 'those', 'with',
    'from', 'than', 'then', 'when', 'where', 'also', 'just',
    'very', 'more', 'most', 'some', 'such', 'about', 'like',
    'into', 'over', 'does', 'will', 'would', 'could', 'should',
    'may', 'might', 'shall', 'need', 'dare', 'ought', 'used',
    'your', 'their', 'them', 'they', 'have', 'been', 'being',
  ]);
  return tokens.filter(t => !stopWords.has(t));
}

function tfidfRetrieve(query: string, chunks: Chunk[], topK = 3): { chunk: Chunk; score: number }[] {
  const qTerms = extractTerms(query);
  const scored = chunks.map(chunk => {
    const cLower = chunk.content.toLowerCase();
    const words = cLower.split(/\s+/);
    const wordFreq = new Map<string, number>();
    for (const w of words) wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
    const totalWords = words.length;

    let score = 0;
    for (const term of qTerms) {
      const tf = (wordFreq.get(term) || 0) / Math.max(totalWords, 1);
      const df = cLower.includes(term) ? 1 : 0;
      const idf = df > 0 ? Math.log((2) / (df + 1)) + 1 : 0;
      score += tf * idf;
    }

    const phrase = qTerms.join(' ');
    if (cLower.includes(phrase)) score *= 2;

    const first200 = cLower.slice(0, 200);
    if (qTerms.some(t => first200.includes(t))) score += 0.5;

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

const TEST_QUERIES = [
  { query: 'When was the first microprocessor invented', expectedTerms: ['intel', '4004'] },
  { query: 'What processors dominated the 8-bit era', expectedTerms: ['8080', 'zilog', 'z80'] },
  { query: 'What is System-on-Chip', expectedTerms: ['system', 'chip', 'soc'] },
  { query: 'How are microprocessors used in AI', expectedTerms: ['ai', 'machine', 'learning'] },
  { query: 'What are future trends in microprocessors', expectedTerms: ['quantum', 'computing'] },
];

async function benchmarkStrategy(
  name: string,
  chunks: Chunk[],
  chunkTimeMs: number,
  stats: { totalChunks: number; avgTokens: number; minTokens: number; maxTokens: number }
): Promise<BenchmarkResult> {
  const retrievalResults: RetrievalResult[] = [];
  let totalRetrievalMs = 0;

  for (const tq of TEST_QUERIES) {
    const rStart = Date.now();
    const top = tfidfRetrieve(tq.query, chunks);
    const latencyMs = Date.now() - rStart;
    totalRetrievalMs += latencyMs;

    const topChunks = top.map(t => ({
      snippet: t.chunk.content.substring(0, 80).replace(/\n/g, ' '),
      score: t.score,
    }));

    const combinedText = top.map(t => t.chunk.content).join(' ').toLowerCase();
    const expectedSet = new Set(tq.expectedTerms.map(t => t.toLowerCase()));
    const foundTerms = new Set<string>();
    for (const term of expectedSet) {
      if (combinedText.includes(term)) foundTerms.add(term);
    }
    const recall = expectedSet.size > 0 ? foundTerms.size / expectedSet.size : 0;
    const precision = top.length > 0
      ? top.filter(t => tq.expectedTerms.some(term => t.chunk.content.toLowerCase().includes(term))).length / top.length
      : 0;

    retrievalResults.push({
      query: tq.query,
      expectedTerms: tq.expectedTerms,
      topChunks,
      recall,
      precision,
      latencyMs,
    });
  }

  const avgRecall = retrievalResults.reduce((a, r) => a + r.recall, 0) / retrievalResults.length;

  return {
    strategy: name,
    chunkTimeMs,
    totalChunks: stats.totalChunks,
    avgTokens: stats.avgTokens,
    minTokens: stats.minTokens,
    maxTokens: stats.maxTokens,
    retrievalResults,
    retrievalAvgRecall: avgRecall,
    retrievalLatencyMs: Math.round(totalRetrievalMs / retrievalResults.length),
  };
}

function printDivider() {
  console.log('='.repeat(110));
}

function printResults(results: BenchmarkResult[]) {
  printDivider();
  console.log('CHUNKING STRATEGY BENCHMARK REPORT');
  console.log(`Date: ${new Date().toISOString().split('T')[0]}`);
  printDivider();
  console.log();
  console.log('OVERALL COMPARISON');
  console.log('-'.repeat(90));
  const header =
    'Strategy'.padEnd(18) +
    'Chunks'.padEnd(8) +
    'Avg Tkn'.padEnd(10) +
    'Min/Max'.padEnd(14) +
    'Time(ms)'.padEnd(10) +
    'Recall@3'.padEnd(11) +
    'Prec@3'.padEnd(9) +
    'Avg Ms';
  console.log(header);
  console.log('-'.repeat(header.length));
  for (const r of results) {
    const avgPrec = r.retrievalResults.reduce((a, rr) => a + rr.precision, 0) / r.retrievalResults.length;
    console.log(
      r.strategy.padEnd(18) +
      String(r.totalChunks).padEnd(8) +
      String(r.avgTokens).padEnd(10) +
      `${r.minTokens}/${r.maxTokens}`.padEnd(14) +
      String(r.chunkTimeMs).padEnd(10) +
      (r.retrievalAvgRecall * 100).toFixed(0) + '%'.padEnd(10) +
      (avgPrec * 100).toFixed(0) + '%'.padEnd(8) +
      String(r.retrievalLatencyMs)
    );
  }
  console.log();

  for (const r of results) {
    printDivider();
    console.log(`\n${r.strategy} — Per-Query Breakdown`);
    console.log();
    for (let i = 0; i < r.retrievalResults.length; i++) {
      const rr = r.retrievalResults[i];
      console.log(`Q${i + 1}: ${rr.query}`);
      console.log(`  Expected terms: [${rr.expectedTerms.join(', ')}]  Recall: ${(rr.recall * 100).toFixed(0)}%  Precision: ${(rr.precision * 100).toFixed(0)}%  ${rr.latencyMs}ms`);
      for (let j = 0; j < rr.topChunks.length; j++) {
        const c = rr.topChunks[j];
        console.log(`  #${j + 1} [score=${c.score.toFixed(3)}]: "${c.snippet}..."`);
      }
      console.log();
    }
  }
}

async function main() {
  const pages = loadPages();
  const docs = loadDocuments();
  const docMap = new Map(docs.map(d => [d.id, d]));

  console.log(`Loaded ${pages.length} non-empty pages from ${docs.length} documents\n`);

  const mcoPages = pages.filter(p => {
    const doc = docMap.get(p.documentId);
    return doc && doc.filename.includes('mco');
  });

  if (mcoPages.length === 0) {
    console.log('No mco presentation pages found');
    process.exit(1);
  }

  const totalTokens = mcoPages.reduce((a, p) => a + countTokens(p.text), 0);
  console.log(`Benchmarking on: mco presentation file.pdf (${mcoPages.length} pages, ${totalTokens} tokens)\n`);

  const results: BenchmarkResult[] = [];

  const f = fixedSizeChunking(mcoPages, 500, 50);
  results.push(await benchmarkStrategy('Fixed-Size', f.chunks, f.timeMs, f.stats));

  const sem = await semanticChunking(mcoPages, 0.7, 100, 500);
  results.push(await benchmarkStrategy('Semantic', sem.chunks, sem.timeMs, sem.stats));

  const sw = slidingWindowChunking(mcoPages, 500, 100);
  results.push(await benchmarkStrategy('Sliding Window', sw.chunks, sw.timeMs, sw.stats));

  const h = hierarchicalChunking(mcoPages, 100, 500);
  results.push(await benchmarkStrategy('Hierarchical', h.chunks, h.timeMs, h.stats));

  printResults(results);

  console.log('\nRERANKER TEST');
  console.log('-'.repeat(40));
  await rerankerService.initialize();
  for (const tq of TEST_QUERIES.slice(0, 2)) {
    const rStart = Date.now();
    const reranked = await rerankerService.rerank(tq.query, f.chunks, 3);
    const lat = Date.now() - rStart;
    console.log(`\nQuery: "${tq.query}"`);
    console.log(`  Reranker latency: ${lat}ms`);
    for (let j = 0; j < reranked.length; j++) {
      console.log(`  #${j + 1} [score=${reranked[j].score.toFixed(4)}]: "${reranked[j].chunk.content.substring(0, 70).replace(/\n/g, ' ')}..."`);
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}
