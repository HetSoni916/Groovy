"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embeddingService = exports.EmbeddingService = void 0;
const transformers_1 = require("@xenova/transformers");
class EmbeddingService {
    constructor() {
        this.extractor = null;
        this.initPromise = null;
    }
    async getExtractor() {
        if (!this.extractor) {
            if (!this.initPromise) {
                this.initPromise = (async () => {
                    this.extractor = await (0, transformers_1.pipeline)('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
                })();
            }
            await this.initPromise;
        }
        return this.extractor;
    }
    async generateEmbedding(text) {
        const embeddings = await this.generateEmbeddings([text]);
        return embeddings[0];
    }
    async generateEmbeddings(texts) {
        if (texts.length === 0)
            return [];
        const validTexts = texts.map(t => t.replace(/\0/g, '').trim()).filter(t => t.length > 0);
        if (validTexts.length === 0)
            return texts.map(() => []);
        const extractor = await this.getExtractor();
        const results = [];
        for (const text of validTexts) {
            const output = await extractor(text, { pooling: 'mean', normalize: true });
            results.push(Array.from(output.data));
        }
        return results;
    }
}
exports.EmbeddingService = EmbeddingService;
exports.embeddingService = new EmbeddingService();
//# sourceMappingURL=embedding.service.js.map