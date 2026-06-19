import { Chunk } from '../types';
interface RerankOptions {
    topK?: number;
    model?: string;
}
interface RerankedResult {
    chunk: Chunk;
    score: number;
    originalRank: number;
}
export declare class RerankerService {
    private client;
    constructor();
    isAvailable(): boolean;
    rerank(query: string, candidates: Chunk[], options?: RerankOptions): Promise<RerankedResult[]>;
    private fallback;
}
export declare const rerankerService: RerankerService;
export {};
//# sourceMappingURL=reranker.service.d.ts.map