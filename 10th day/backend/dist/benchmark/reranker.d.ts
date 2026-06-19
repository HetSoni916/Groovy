import { Chunk } from '../types';
export interface RerankedChunk {
    chunk: Chunk;
    score: number;
}
export declare class RerankerService {
    private model;
    private pipeline;
    initialize(): Promise<void>;
    rerank(query: string, chunks: Chunk[], topK?: number): Promise<RerankedChunk[]>;
    private fallbackRerank;
}
export declare const rerankerService: RerankerService;
//# sourceMappingURL=reranker.d.ts.map