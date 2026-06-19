import { Chunk, Page } from '../types';
interface StrategyResult {
    name: string;
    chunks: Chunk[];
    timeMs: number;
    stats: {
        totalChunks: number;
        avgTokens: number;
        minTokens: number;
        maxTokens: number;
    };
}
export declare function fixedSizeChunking(pages: (Page & {
    documentId: string;
})[], chunkSize?: number, overlap?: number): StrategyResult;
export declare function semanticChunking(pages: (Page & {
    documentId: string;
})[], threshold?: number, minChunkTokens?: number, maxChunkTokens?: number): Promise<StrategyResult>;
export declare function slidingWindowChunking(pages: (Page & {
    documentId: string;
})[], windowSize?: number, stride?: number): StrategyResult;
export declare function hierarchicalChunking(pages: (Page & {
    documentId: string;
})[], leafSize?: number, parentSize?: number): StrategyResult;
export {};
//# sourceMappingURL=strategies.d.ts.map