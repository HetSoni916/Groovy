import { Chunk } from '../types';
export declare class VectorStore {
    private client;
    private collection;
    constructor();
    private getCollection;
    addChunks(chunks: Chunk[], documentId: string, filenames: Map<string, string>): Promise<void>;
    search(queryEmbedding: number[], topK?: number, documentIds?: string[]): Promise<{
        chunk: Chunk;
        score: number;
    }[]>;
    deleteDocument(documentId: string): Promise<void>;
    count(): Promise<number>;
}
export declare const vectorStore: VectorStore;
//# sourceMappingURL=vectorStore.d.ts.map