"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunkerService = exports.ChunkerService = void 0;
const uuid_1 = require("uuid");
const tokenizer_1 = require("../utils/tokenizer");
const config_1 = require("../config");
const storage_1 = require("../utils/storage");
const embedding_service_1 = require("./embedding.service");
const vectorStore_1 = require("./vectorStore");
class ChunkerService {
    async chunkPages(documentId, pages) {
        const chunks = [];
        for (const page of pages) {
            const pageChunks = this.splitPageIntoChunks(page, documentId);
            chunks.push(...pageChunks);
        }
        await this.generateEmbeddings(chunks);
        storage_1.storage.saveChunks(chunks);
        const docs = storage_1.storage.getDocuments();
        const filenames = new Map(docs.map(d => [d.id, d.filename]));
        await vectorStore_1.vectorStore.addChunks(chunks, documentId, filenames);
        return chunks;
    }
    async generateEmbeddings(chunks) {
        const contents = chunks.map(c => c.content);
        try {
            const embeddings = await embedding_service_1.embeddingService.generateEmbeddings(contents);
            for (let i = 0; i < chunks.length; i++) {
                if (embeddings[i] && embeddings[i].length > 0) {
                    chunks[i].embedding = embeddings[i];
                }
            }
        }
        catch (err) {
            console.warn('Embedding generation failed, falling back to TF-IDF:', err.message);
        }
    }
    splitPageIntoChunks(page, documentId) {
        const chunks = [];
        const paragraphs = page.text.split(/\n\s*\n/);
        let currentChunk = '';
        let currentTokens = 0;
        let currentStart = page.pageNumber;
        for (const paragraph of paragraphs) {
            const trimmed = paragraph.trim();
            if (!trimmed)
                continue;
            const paraTokens = (0, tokenizer_1.countTokens)(trimmed);
            if (currentTokens + paraTokens > config_1.config.chunkTokenLimit && currentChunk) {
                chunks.push(this.createChunk(documentId, currentStart, page.pageNumber, currentChunk));
                currentChunk = '';
                currentTokens = 0;
                currentStart = page.pageNumber;
            }
            if (currentChunk)
                currentChunk += '\n\n';
            currentChunk += trimmed;
            currentTokens += paraTokens;
        }
        if (currentChunk) {
            chunks.push(this.createChunk(documentId, currentStart, page.pageNumber, currentChunk));
        }
        return chunks;
    }
    createChunk(documentId, pageStart, pageEnd, content) {
        return {
            id: (0, uuid_1.v4)(),
            documentId,
            pageStart,
            pageEnd,
            content,
            tokenCount: (0, tokenizer_1.countTokens)(content),
        };
    }
    getChunksForQuery(documentIds) {
        const allChunks = storage_1.storage.getChunks();
        if (!documentIds || documentIds.length === 0)
            return allChunks;
        return allChunks.filter(c => documentIds.includes(c.documentId));
    }
}
exports.ChunkerService = ChunkerService;
exports.chunkerService = new ChunkerService();
//# sourceMappingURL=chunker.js.map