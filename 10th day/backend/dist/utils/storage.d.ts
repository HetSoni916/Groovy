import { Document, Page, Chunk, ChatEntry } from '../types';
export declare class StorageService {
    private docsPath;
    private pagesPath;
    private chunksPath;
    private chatsPath;
    constructor();
    private initFile;
    private read;
    private write;
    saveDocument(doc: Document): void;
    getDocuments(): Document[];
    getDocument(id: string): Document | undefined;
    deleteDocument(id: string): void;
    savePage(page: Page & {
        documentId: string;
    }): void;
    savePages(pages: (Page & {
        documentId: string;
    })[]): void;
    getPages(documentId: string): (Page & {
        documentId: string;
    })[];
    getAllPages(): (Page & {
        documentId: string;
    })[];
    saveChunk(chunk: Chunk): void;
    saveChunks(chunks: Chunk[]): void;
    getChunks(documentId?: string): Chunk[];
    saveChat(entry: ChatEntry): void;
    getChatHistory(): ChatEntry[];
    clearChatHistory(): void;
}
export declare const storage: StorageService;
//# sourceMappingURL=storage.d.ts.map