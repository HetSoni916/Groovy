import { MemorySaver } from '@langchain/langgraph';

export function createCheckpointer(): MemorySaver {
  return new MemorySaver();
}

export function generateThreadId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}
