"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vectorStore = exports.VectorStore = void 0;
const chromadb_1 = require("chromadb");
const COLLECTION_NAME = 'ask-my-notes';
class VectorStore {
    constructor() {
        this.collection = null;
        this.client = new chromadb_1.ChromaClient({ host: 'localhost', port: 8000 });
    }
    async getCollection() {
        if (!this.collection) {
            const collections = await this.client.listCollections();
            const exists = collections.some((c) => c.name === COLLECTION_NAME);
            if (exists) {
                this.collection = await this.client.getCollection({ name: COLLECTION_NAME });
            }
            else {
                this.collection = await this.client.createCollection({ name: COLLECTION_NAME, metadata: { 'hnsw:space': 'cosine' } });
            }
        }
        return this.collection;
    }
    async addChunks(chunks, documentId, filenames) {
        const withEmbeddings = chunks.filter(c => c.embedding && c.embedding.length > 0);
        if (withEmbeddings.length === 0)
            return;
        const collection = await this.getCollection();
        const ids = withEmbeddings.map(c => c.id);
        const embeddings = withEmbeddings.map(c => c.embedding);
        const metadatas = withEmbeddings.map(c => ({
            documentId,
            pageStart: c.pageStart,
            pageEnd: c.pageEnd,
            filename: filenames.get(documentId) || 'Unknown',
        }));
        const documents = withEmbeddings.map(c => c.content);
        await collection.add({ ids, embeddings, metadatas, documents });
    }
    async search(queryEmbedding, topK = 15, documentIds) {
        const collection = await this.getCollection();
        const where = documentIds && documentIds.length > 0
            ? { documentId: { $in: documentIds } }
            : undefined;
        const results = await collection.query({
            queryEmbeddings: [queryEmbedding],
            nResults: topK,
            where,
        });
        if (!results.ids[0] || results.ids[0].length === 0)
            return [];
        return results.ids[0].map((id, i) => ({
            chunk: {
                id,
                documentId: results.metadatas[0][i].documentId,
                pageStart: results.metadatas[0][i].pageStart,
                pageEnd: results.metadatas[0][i].pageEnd,
                content: results.documents[0][i],
                tokenCount: 0,
            },
            score: results.distances ? 1 - results.distances[0][i] : 0,
        }));
    }
    async deleteDocument(documentId) {
        try {
            const collection = await this.getCollection();
            await collection.delete({ where: { documentId } });
        }
        catch {
            // collection may not exist yet
        }
    }
    async count() {
        try {
            const collection = await this.getCollection();
            return await collection.count();
        }
        catch {
            return 0;
        }
    }
}
exports.VectorStore = VectorStore;
exports.vectorStore = new VectorStore();
//# sourceMappingURL=vectorStore.js.map