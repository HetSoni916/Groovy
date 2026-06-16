import { CodeChunk } from '../types';
export declare function countTokens(text: string): number;
export declare function truncateToTokens(text: string, maxTokens: number): string;
export declare function buildContextWindow(chunks: CodeChunk[], maxTokens: number): string;
//# sourceMappingURL=tokenizer.d.ts.map