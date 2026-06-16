import { Request, Response, NextFunction } from 'express';
import { retrievalService } from '../services/retrieval';
import { groqService } from '../services/anthropic.service';
import { storage } from '../utils/storage';
import { ChatEntry, Source } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

const SYSTEM_PROMPT = `You are a helpful note assistant. Your role is to answer questions using ONLY the provided PDF content.

RULES:
- Answer only from the provided context. Never use external knowledge.
- If the context does not contain the answer, respond: "I could not find this information in the uploaded notes."
- Always cite the source filename and page number for each piece of information.
- Format answers using markdown for readability.
- Be concise but complete.
- If the context is unclear, acknowledge the uncertainty.`;

export async function askQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { question, documentIds } = req.body;

    if (!question || !question.trim()) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    const scoredChunks = retrievalService.search(question, documentIds);
    const context = retrievalService.buildContext(scoredChunks);

    if (!context.trim()) {
      res.json({
        answer: 'I could not find this information in the uploaded notes.',
        sources: [],
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: 0, latencyMs: 0, model: 'llama-3.3-70b-versatile' },
      });
      return;
    }

    const result = await groqService.generateResponse(SYSTEM_PROMPT, context, question);

    const documents = storage.getDocuments();
    const docMap = new Map(documents.map(d => [d.id, d]));

    const sources: Source[] = [];
    const seen = new Set<string>();

    for (const { chunk } of scoredChunks) {
      const doc = docMap.get(chunk.documentId);
      const key = `${doc?.filename}-${chunk.pageStart}`;
      if (!seen.has(key) && doc) {
        seen.add(key);
        sources.push({ filename: doc.filename, pageNumber: chunk.pageStart });
      }
    }

    const entry: ChatEntry = {
      id: uuidv4(),
      question,
      answer: result.answer,
      sources,
      usage: result.usage,
      timestamp: new Date().toISOString(),
    };

    storage.saveChat(entry);

    res.json({
      answer: result.answer,
      sources,
      usage: result.usage,
    });
  } catch (err) {
    next(err);
  }
}

export async function getChatHistory(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const history = storage.getChatHistory();
    res.json(history);
  } catch (err) {
    next(err);
  }
}

export async function clearChatHistory(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    storage.clearChatHistory();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
