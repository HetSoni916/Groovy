export interface Document {
  id: string;
  filename: string;
  totalPages: number;
  totalWords: number;
  uploadedAt: string;
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

export interface QueryResponse {
  answer: string;
  sources: Source[];
  usage: TokenUsage;
}

export interface PdfUploadResponse {
  document: Document;
  pages: number;
  words: number;
}

export interface ChatEntry {
  id: string;
  question: string;
  answer: string;
  sources: Source[];
  usage: TokenUsage;
  timestamp: string;
}
