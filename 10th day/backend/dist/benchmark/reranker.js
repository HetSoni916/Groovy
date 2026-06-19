"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.rerankerService = exports.RerankerService = void 0;
class RerankerService {
    constructor() {
        this.model = null;
        this.pipeline = null;
    }
    async initialize() {
        try {
            const mod = await Promise.resolve().then(() => __importStar(require('@xenova/transformers')));
            this.pipeline = mod.pipeline;
            this.model = await this.pipeline('text-classification', 'Xenova/ms-marco-MiniLM-L-6-v2');
        }
        catch (err) {
            console.warn('Reranker model failed to load:', err.message);
            console.warn('Falling back to score-only reranking');
            this.model = null;
        }
    }
    async rerank(query, chunks, topK = 3) {
        if (!this.model) {
            return this.fallbackRerank(query, chunks, topK);
        }
        const pairs = chunks.map(c => ({ text: c.content, text_pair: query }));
        const inputs = pairs.map(p => ({ text: p.text, text_pair: p.text_pair }));
        const batchSize = 10;
        const allScores = [];
        for (let i = 0; i < inputs.length; i += batchSize) {
            const batch = inputs.slice(i, i + batchSize);
            try {
                const outputs = await this.model(batch);
                const scores = Array.isArray(outputs) ? outputs.map((o) => o.score) : [outputs.score];
                allScores.push(...scores);
            }
            catch {
                for (let j = 0; j < batch.length; j++)
                    allScores.push(0);
            }
        }
        const scored = chunks.map((chunk, i) => ({
            chunk,
            score: allScores[i] || 0,
        }));
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    }
    fallbackRerank(query, chunks, topK) {
        const qLower = query.toLowerCase();
        const qTerms = qLower.split(/\s+/).filter(t => t.length > 2);
        const scored = chunks.map(chunk => {
            const cLower = chunk.content.toLowerCase();
            let score = 0;
            for (const term of qTerms) {
                const regex = new RegExp(term, 'gi');
                const matches = cLower.match(regex);
                if (matches)
                    score += matches.length;
            }
            if (cLower.includes(qLower))
                score *= 2;
            return { chunk, score };
        });
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    }
}
exports.RerankerService = RerankerService;
exports.rerankerService = new RerankerService();
//# sourceMappingURL=reranker.js.map