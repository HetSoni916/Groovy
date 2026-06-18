import { ChatGroq } from '@langchain/groq';
import { ChatOllama } from '@langchain/ollama';
import { createAgent } from 'langchain';
import { DynamicStructuredTool } from 'langchain';
import { MemorySaver } from '@langchain/langgraph';
import { SYSTEM_PROMPT } from './systemPrompt';

function createLLM() {
  const provider = (process.env.LLM_PROVIDER || 'ollama').toLowerCase();

  if (provider === 'groq') {
    return new ChatGroq({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      apiKey: process.env.GROQ_API_KEY,
      temperature: 0.3,
      maxTokens: 4096,
    });
  }

  return new ChatOllama({
    model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    temperature: 0.3,
    numPredict: 4096,
  });
}

export function createLangChainAgent(tools: DynamicStructuredTool[], threadId?: string) {
  const llm = createLLM();

  const agent = createAgent({
    model: llm,
    tools,
    systemPrompt: SYSTEM_PROMPT,
    checkpointer: new MemorySaver(),
    name: 'AskMyNotesAgent',
  });

  return {
    agent,
    threadId: threadId || `session-${Date.now()}`,
  };
}
