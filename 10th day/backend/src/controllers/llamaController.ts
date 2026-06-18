import { Request, Response } from 'express';
import { runAgent } from '../llama/agent';
import { llamaLogger } from '../llama/logger';

export async function askLlamaAgent(req: Request, res: Response) {
  const { question, stream } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'question is required (non-empty string)' });
  }

  llamaLogger.logUserQuery(question);

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const answer = await runAgent(question.trim(), true);
      res.write(`data: ${JSON.stringify({ type: 'done', output: answer })}\n\n`);
      res.end();
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
      res.end();
    }
  } else {
    try {
      const answer = await runAgent(question.trim());
      res.json({ question: question.trim(), answer });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Agent call failed' });
    }
  }
}
