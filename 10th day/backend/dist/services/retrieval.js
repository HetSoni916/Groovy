"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrievalService = exports.RetrievalService = void 0;
const config_1 = require("../config");
const chunker_1 = require("./chunker");
const embedding_service_1 = require("./embedding.service");
const vectorStore_1 = require("./vectorStore");
const reranker_service_1 = require("./reranker.service");
const storage_1 = require("../utils/storage");
class RetrievalService {
    async search(question, documentIds) {
        const queryEmbedding = await embedding_service_1.embeddingService.generateEmbedding(question);
        let results = [];
        if (queryEmbedding.length > 0) {
            results = await vectorStore_1.vectorStore.search(queryEmbedding, config_1.config.maxChunksSelected, documentIds);
            if (results.length > 0)
                return results;
        }
        const chunks = chunker_1.chunkerService.getChunksForQuery(documentIds);
        if (chunks.length === 0)
            return [];
        results = this.tfidfSearch(question, chunks);
        if (config_1.config.useReranker && reranker_service_1.rerankerService.isAvailable()) {
            const firstPassK = Math.min(config_1.config.rerankerFirstPassK, results.length);
            const candidates = results.slice(0, firstPassK);
            const reranked = await reranker_service_1.rerankerService.rerank(question, candidates.map(r => r.chunk), {
                topK: config_1.config.rerankerTopK,
            });
            return reranked.map(r => ({ chunk: r.chunk, score: r.score }));
        }
        return results;
    }
    tfidfSearch(question, chunks, topK) {
        const queryTerms = this.extractTerms(question);
        const scored = [];
        for (const chunk of chunks) {
            const score = this.scoreChunk(chunk, queryTerms);
            if (score > 0)
                scored.push({ chunk, score });
        }
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK || config_1.config.maxChunksSelected);
    }
    extractTerms(text) {
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
    scoreChunk(chunk, queryTerms) {
        let score = 0;
        const chunkLower = chunk.content.toLowerCase();
        const chunkWords = chunkLower.split(/\s+/);
        const wordFreq = new Map();
        for (const word of chunkWords) {
            wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        }
        const totalWords = chunkWords.length;
        const numDocs = 1;
        for (const term of queryTerms) {
            const tf = (wordFreq.get(term) || 0) / Math.max(totalWords, 1);
            const df = chunkLower.includes(term) ? 1 : 0;
            const idf = Math.log((numDocs + 1) / (df + 1)) + 1;
            score += tf * idf;
        }
        const exactPhraseBonus = this.hasExactPhrase(chunkLower, queryTerms) ? 2.0 : 0;
        score += exactPhraseBonus;
        const titleBonus = queryTerms.some(term => {
            const first200 = chunkLower.slice(0, 200);
            return first200.includes(term);
        }) ? 0.5 : 0;
        return score + exactPhraseBonus + titleBonus;
    }
    hasExactPhrase(chunkLower, queryTerms) {
        const phrase = queryTerms.join(' ');
        return chunkLower.includes(phrase);
    }
    buildContext(chunks) {
        const documents = storage_1.storage.getDocuments();
        const docMap = new Map(documents.map(d => [d.id, d]));
        let context = '';
        let totalTokens = 0;
        const maxTokens = Math.floor(config_1.config.maxContextTokens * config_1.config.contextBudget);
        for (const { chunk } of chunks) {
            const doc = docMap.get(chunk.documentId);
            const filename = doc?.filename || 'Unknown';
            const pageRef = chunk.pageStart === chunk.pageEnd
                ? `Page ${chunk.pageStart}`
                : `Pages ${chunk.pageStart}-${chunk.pageEnd}`;
            const section = `[Chunk ${chunk.id.substring(0, 8)}] ${filename} — ${pageRef}\n${chunk.content}`;
            const sectionTokens = Math.ceil(section.length / 4);
            if (totalTokens + sectionTokens > maxTokens)
                break;
            if (context)
                context += '\n\n---\n\n';
            context += section;
            totalTokens += sectionTokens;
        }
        return context;
    }
}
exports.RetrievalService = RetrievalService;
exports.retrievalService = new RetrievalService();
//# sourceMappingURL=retrieval.js.map