import { retrievalService } from '../../services/retrieval';
import { groqService } from '../../services/anthropic.service';
import { storage } from '../../utils/storage';
import { sdkLogger } from '../logger';

const RAG_SYSTEM_PROMPT = `You are a helpful note assistant. Your role is to answer questions using ONLY the provided PDF content.

RULES:
- Answer only from the provided context. Never use external knowledge.
- If the context does not contain the answer, respond: "I could not find this information in the uploaded notes."
- INLINE CITATIONS REQUIRED: Cite the source chunk ID and page number for each fact in parentheses, e.g. (chunk: abc12345, Page 3).
- Each paragraph must end with a citation to its source chunk.
- Format answers using markdown for readability.
- Be concise but complete.
- If the context is unclear, acknowledge the uncertainty.`;

export async function askMyNotes(question: string, documentIds?: string[]): Promise<string> {
  sdkLogger.toolCallGenerated('ask_my_notes', { question, documentIds });

  try {
    const scoredChunks = await retrievalService.search(question, documentIds);

    if (scoredChunks.length > 0) {
      sdkLogger.warn(`Retrieved ${scoredChunks.length} chunks`);
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

    const result = await groqService.generateResponse(RAG_SYSTEM_PROMPT, context, question);

    let answer = result.answer;
    if (sources.length > 0) {
      answer += '\n\n**Sources:**\n' + sources.join('\n');
    }

    return answer;
  } catch (err: any) {
    sdkLogger.toolError('ask_my_notes', err.message);
    return `Error: Failed to generate answer from notes - ${err.message}. Please try again.`;
  }
}
