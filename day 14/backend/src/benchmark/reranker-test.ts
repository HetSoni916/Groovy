import * as path from 'path';
import * as fs from 'fs';
import { Chunk, Page } from '../types';
import { rerankerService } from '../services/reranker.service';

const STORAGE_DIR = path.resolve(__dirname, '../../storage');

function loadChunks(): Chunk[] {
  const raw = fs.readFileSync(path.join(STORAGE_DIR, 'chunks.json'), 'utf-8');
  return JSON.parse(raw);
}

function extractTerms(text: string): string[] {
  const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const tokens = cleaned.split(/\s+/).filter(t => t.length > 2);
  const stopWords = new Set(['the','and','for','are','not','but','had','has','was','all','can','each','any','how','why','what','which','who','whom','this','that','these','those','with','from','than','then','when','where','also','just','very','more','most','some','such','about','like','into','over','does','will','would','could','should','may','might','shall','need','dare','ought','used','your','their','them','they','have','been','being']);
  return tokens.filter(t => !stopWords.has(t));
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

function firstPass(query: string, chunks: Chunk[], topK = 10): { chunk: Chunk; score: number }[] {
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
      const idf = Math.log((2) / (df + 1)) + 1;
      score += tf * idf;
    }
    if (cLower.includes(qTerms.join(' '))) score *= 2;
    return { chunk, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

const TEST_QUERIES = [
  'When was the first microprocessor invented and what was it called?',
  'What processors dominated the 8-bit era?',
  'What is System-on-Chip?',
  'How are microprocessors used in AI and machine learning?',
  'What are the future trends in microprocessors?',
  'What is Het Soni\'s email address?',
  'What technologies did Het Soni use for his internship?',
  'What are the challenges of cloud-based backup?',
];

function printDivider() {
  console.log('='.repeat(90));
}

async function main() {
  const chunks = loadChunks();
  console.log(`\nLoaded ${chunks.length} chunks from storage\n`);

  const hasCohere = rerankerService.isAvailable();
  console.log(`Cohere API key: ${hasCohere ? '✓ SET' : '✗ NOT SET (using fallback keyword reranker)'}\n`);

  for (const query of TEST_QUERIES) {
    printDivider();
    console.log(`\nQUERY: "${query}"\n`);

    const candidates = firstPass(query, chunks, 10);
    console.log(`First-pass retrieved ${candidates.length} candidates\n`);

    console.log('Top 3 before reranking:');
    for (let i = 0; i < Math.min(3, candidates.length); i++) {
      const c = candidates[i];
      console.log(`  #${i + 1} [score=${c.score.toFixed(4)}]: "${c.chunk.content.substring(0, 80).replace(/\n/g, ' ')}..."`);
    }

    const reranked = await rerankerService.rerank(query, candidates.map(c => c.chunk), { topK: 3 });
    console.log(`\nTop 3 after reranking${hasCohere ? ' (Cohere)' : ' (keyword fallback)'}:`);
    for (let i = 0; i < reranked.length; i++) {
      const r = reranked[i];
      console.log(`  #${i + 1} [score=${r.score.toFixed(4)}, orig rank #${r.originalRank + 1}]: "${r.chunk.content.substring(0, 80).replace(/\n/g, ' ')}..."`);
    }

    const improved = reranked.some((r, i) => r.originalRank >= 3 && i < 3);
    if (improved) {
      console.log('  → Reranker promoted a previously excluded chunk into top 3 ✓');
    } else if (hasCohere) {
      console.log('  → Same order as first-pass (reranker agreed with first-pass scores)');
    }
    console.log();
  }

  if (!hasCohere) {
    console.log('\n---');
    console.log('To use Cohere reranker:');
    console.log('  1. Get an API key at https://dashboard.cohere.ai');
    console.log(`  2. Add to .env: COHERE_API_KEY=your_key`);
    console.log('  3. Re-run this script\n');
  }

  printDivider();
  console.log('\nRERANKING SUMMARY');
  console.log('-'.repeat(30));
  console.log('Without Reranker: First-pass TF-IDF → top 3 (fast, keyword-based)');
  console.log('With Reranker:    First-pass TF-IDF → top 10 → Cohere cross-encoder → top 3');
  console.log('                  (more accurate, ~200ms added latency, $0.001/query)');
}

if (require.main === module) {
  main().catch(console.error);
}
