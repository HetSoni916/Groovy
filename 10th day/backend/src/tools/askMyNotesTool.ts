import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { retrievalService } from '../services/retrieval';
import { groqService } from '../services/anthropic.service';
import { storage } from '../utils/storage';
import { agentLogger } from '../agent/logger';

const RAG_SYSTEM_PROMPT = `You are a helpful note assistant. Your role is to answer questions using ONLY the provided PDF content.

RULES:
- Answer only from the provided context. Never use external knowledge.
- If the context does not contain the answer, respond: "I could not find this information in the uploaded notes."
- INLINE CITATIONS REQUIRED: Cite the source chunk ID and page number for each fact in parentheses, e.g. (chunk: abc12345, Page 3).
- Each paragraph must end with a citation to its source chunk.
- Format answers using markdown for readability.
- Be concise but complete.
- If the context is unclear, acknowledge the uncertainty.`;

async function askMyNotes(question: string, documentIds?: string[]): Promise<string> {
  agentLogger.logRetrievalResults(0);

  const scoredChunks = await retrievalService.search(question, documentIds);

  if (scoredChunks.length > 0) {
    agentLogger.logRetrievalResults(scoredChunks.length, scoredChunks.map(c => c.score));
    if (scoredChunks.length >= 3) {
      agentLogger.logRerankScores(scoredChunks.slice(0, 3).map(c => c.score));
    }
  }

  const context = retrievalService.buildContext(scoredChunks);

  if (!context.trim()) {
    return 'Answer: I could not find this information in the uploaded notes.\n\nNo relevant documents found.';
  }

  const documents = storage.getDocuments();
  const docMap = new Map(documents.map(d => [d.id, d]));

  const seen = new Set<string>();
  const sources: string[] = [];
  for (const { chunk, score } of scoredChunks.slice(0, 5)) {
    const doc = docMap.get(chunk.documentId);
    const key = `${doc?.filename}-${chunk.pageStart}`;
    if (!seen.has(key) && doc) {
      seen.add(key);
      sources.push(`- ${doc.filename} (Page ${chunk.pageStart}) [relevance: ${(score * 100).toFixed(1)}%]`);
    }
  }

  try {
    const result = await groqService.generateResponse(RAG_SYSTEM_PROMPT, context, question);

    agentLogger.logTokenUsage({
      input: result.usage.inputTokens,
      output: result.usage.outputTokens,
      total: result.usage.totalTokens,
    });
    agentLogger.logCost(result.usage.cost);

    let answer = result.answer;
    if (sources.length > 0) {
      answer += '\n\n**Sources:**\n' + sources.join('\n');
    }

    return answer;
  } catch (err: any) {
    agentLogger.logToolError('ask_my_notes', err);
    return `Error: Failed to generate answer from notes - ${err.message}. Please try again.`;
  }
}

export const askMyNotesTool = new DynamicStructuredTool({
  name: 'ask_my_notes',
  description: 'Search the user\'s uploaded PDF documents (notes) for information. Use this when the user asks about content from their own documents, uploaded PDFs, or notes. Returns answers with source page citations.',
  schema: z.object({
    question: z.string().describe('The question to search for in the uploaded notes/documents'),
    documentIds: z.array(z.string()).optional().describe('Optional: restrict search to specific document IDs'),
  }),
  func: async ({ question, documentIds }) => {
    return await askMyNotes(question, documentIds);
  },
});
