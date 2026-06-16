import { Repository, RetrievalResult, QueryResponse } from '../types';
export declare function search(query: string, repo: Repository, topK?: number): Promise<RetrievalResult[]>;
export declare function buildAnswer(question: string, results: RetrievalResult[], provider: string, mode: 'beginner' | 'advanced'): Promise<QueryResponse>;
//# sourceMappingURL=retrieval.d.ts.map