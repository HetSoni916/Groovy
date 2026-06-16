import { RetrievalResult } from '../types';
export declare class VectorStore {
    private chunks;
    private termFreqs;
    private idf;
    private dirty;
    addChunk(id: string, text: string, metadata: any): void;
    clear(): void;
    rebuildIndex(): void;
    search(query: string, topK: number): RetrievalResult[];
    get size(): number;
    private tokenize;
}
//# sourceMappingURL=vectorStore.d.ts.map