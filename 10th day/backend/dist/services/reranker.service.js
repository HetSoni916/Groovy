"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rerankerService = exports.RerankerService = void 0;
const cohere_ai_1 = require("cohere-ai");
class RerankerService {
    constructor() {
        this.client = null;
        const apiKey = process.env.COHERE_API_KEY || '';
        if (apiKey) {
            this.client = new cohere_ai_1.CohereClient({ token: apiKey });
        }
    }
    isAvailable() {
        return this.client !== null;
    }
    async rerank(query, candidates, options = {}) {
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
        }
        catch (err) {
            console.warn('Cohere reranker failed, falling back:', err.message);
            return this.fallback(query, candidates, topK);
        }
    }
    fallback(query, candidates, topK) {
        const qLower = query.toLowerCase();
        const qTerms = qLower.split(/\s+/).filter(t => t.length > 2);
        const scored = candidates.map((chunk, i) => {
            const cLower = chunk.content.toLowerCase();
            let score = 0;
            for (const term of qTerms) {
                const matches = cLower.split(term).length - 1;
                score += matches;
            }
            if (cLower.includes(qLower))
                score *= 2;
            return { chunk, score, originalRank: i };
        });
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    }
}
exports.RerankerService = RerankerService;
exports.rerankerService = new RerankerService();
//# sourceMappingURL=reranker.service.js.map