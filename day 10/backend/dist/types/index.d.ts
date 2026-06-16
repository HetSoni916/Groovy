export interface FileInfo {
    id: string;
    path: string;
    language: string;
    content: string;
    size: number;
    functions: FunctionInfo[];
    classes: ClassInfo[];
    imports: string[];
    exports: string[];
    summary: string;
}
export interface FunctionInfo {
    name: string;
    startLine: number;
    endLine: number;
}
export interface ClassInfo {
    name: string;
    startLine: number;
    endLine: number;
    methods: string[];
}
export interface CodeChunk {
    id: string;
    fileId: string;
    filePath: string;
    startLine: number;
    endLine: number;
    content: string;
    summary: string;
    tokenCount: number;
}
export interface Repository {
    id: string;
    name: string;
    hash: string;
    files: FileInfo[];
    chunks: CodeChunk[];
    summary?: RepoSummary;
    createdAt: string;
}
export interface RepoSummary {
    projectName: string;
    techStack: string[];
    totalFiles: number;
    totalLines: number;
    entryPoints: string[];
    envVars: string[];
    apiRoutes: string[];
    folderStructure: string;
}
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
export interface RetrievalResult {
    chunk: CodeChunk;
    score: number;
}
export interface QueryRequest {
    repoId: string;
    question: string;
    mode: 'beginner' | 'advanced';
    provider: string;
}
export interface QueryResponse {
    answer: string;
    references: {
        file: string;
        lines: string;
        snippet: string;
    }[];
    usage: {
        input: number;
        output: number;
        cost: number;
    };
}
export interface AIProvider {
    generateResponse(messages: ChatMessage[]): Promise<string>;
}
//# sourceMappingURL=index.d.ts.map