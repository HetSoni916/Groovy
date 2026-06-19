export interface Document {
    id: string;
    filename: string;
    totalPages: number;
    totalWords: number;
    uploadedAt: string;
    filePath: string;
}
export interface Page {
    pageNumber: number;
    text: string;
    wordCount: number;
}
export interface Chunk {
    id: string;
    documentId: string;
    pageStart: number;
    pageEnd: number;
    content: string;
    tokenCount: number;
    embedding?: number[];
}
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
export interface ChatEntry {
    id: string;
    question: string;
    answer: string;
    sources: Source[];
    usage: TokenUsage;
    timestamp: string;
}
export interface Source {
    filename: string;
    pageNumber: number;
}
export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
    latencyMs: number;
    model: string;
}
export interface QueryRequest {
    question: string;
    documentIds?: string[];
}
export interface ChunkResult {
    id: string;
    documentId: string;
    filename: string;
    pageStart: number;
    pageEnd: number;
    content: string;
    score: number;
}
export interface QueryResponse {
    answer: string;
    sources: Source[];
    usage: TokenUsage;
    chunks: ChunkResult[];
}
export interface PdfUploadResponse {
    document: Document;
    pages: number;
    words: number;
}
//# sourceMappingURL=index.d.ts.map