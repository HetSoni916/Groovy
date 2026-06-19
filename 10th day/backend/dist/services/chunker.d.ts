import { Chunk, Page } from '../types';
export declare class ChunkerService {
    chunkPages(documentId: string, pages: (Page & {
        documentId: string;
    })[]): Promise<Chunk[]>;
    private generateEmbeddings;
    private splitPageIntoChunks;
    private createChunk;
    getChunksForQuery(documentIds?: string[]): Chunk[];
}
export declare const chunkerService: ChunkerService;
//# sourceMappingURL=chunker.d.ts.map