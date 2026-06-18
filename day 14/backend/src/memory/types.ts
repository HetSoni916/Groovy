export type MemoryRole = 'user' | 'assistant' | 'system' | 'tool';

export interface ConversationEntry {
  id: string;
  role: MemoryRole;
  content: string;
  timestamp: number;
  toolCalls?: { name: string; args: string; result: string }[];
  tokenCount: number;
}

export interface ShortTermConfig {
  maxMessages: number;
  maxTokens: number;
  enableSummarization: boolean;
}

export interface LongTermFact {
  id: string;
  userId: string;
  content: string;
  category: 'preference' | 'fact' | 'relationship' | 'routine' | 'other';
  importance: number;
  embedding: number[];
  timestamp: number;
  lastAccessed: number;
  accessCount: number;
  source: string;
}

export interface MemoryEntry {
  id: string;
  userId: string;
  content: string;
  category: string;
  importance: number;
  timestamp: number;
  metadata: Record<string, unknown>;
}

export interface MemoryQuery {
  userId: string;
  query: string;
  topK: number;
  minImportance: number;
  categories?: string[];
}

export interface MemoryResult {
  fact: LongTermFact;
  relevance: number;
}

export interface MemoryContext {
  conversationHistory: ConversationEntry[];
  relevantFacts: MemoryResult[];
  summary?: string;
}

export interface MemoryConfig {
  shortTerm: ShortTermConfig;
  longTerm: {
    storagePath: string;
    topK: number;
    minImportance: number;
    similarityThreshold: number;
    dedupThreshold: number;
  };
  extraction: {
    enabled: boolean;
    minImportance: number;
  };
}

export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  shortTerm: {
    maxMessages: 20,
    maxTokens: 4000,
    enableSummarization: true,
  },
  longTerm: {
    storagePath: '',
    topK: 5,
    minImportance: 0.3,
    similarityThreshold: 0.75,
    dedupThreshold: 0.92,
  },
  extraction: {
    enabled: true,
    minImportance: 0.5,
  },
};
