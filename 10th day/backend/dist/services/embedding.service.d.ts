export declare class EmbeddingService {
    private extractor;
    private initPromise;
    private getExtractor;
    generateEmbedding(text: string): Promise<number[]>;
    generateEmbeddings(texts: string[]): Promise<number[][]>;
}
export declare const embeddingService: EmbeddingService;
//# sourceMappingURL=embedding.service.d.ts.map