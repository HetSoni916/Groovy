import { Chunk } from '../types';
interface ScoredChunk {
    chunk: Chunk;
    score: number;
}
export declare class RetrievalService {
    search(question: string, documentIds?: string[]): Promise<ScoredChunk[]>;
    private tfidfSearch;
    private extractTerms;
    private scoreChunk;
    private hasExactPhrase;
    buildContext(chunks: ScoredChunk[]): string;
}
export declare const retrievalService: RetrievalService;
export {};
//# sourceMappingURL=retrieval.d.ts.map