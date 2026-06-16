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

export interface FileInfo {
  id: string;
  path: string;
  language: string;
  summary: string;
}

export interface Repository {
  id: string;
  name: string;
  files: FileInfo[];
  summary?: RepoSummary;
}

export interface Reference {
  file: string;
  lines: string;
  snippet: string;
}

export interface Usage {
  input: number;
  output: number;
  cost: number;
}

export interface QueryResponse {
  answer: string;
  references: Reference[];
  usage: Usage;
}

export interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  references: Reference[];
  usage: Usage;
  timestamp: number;
}
