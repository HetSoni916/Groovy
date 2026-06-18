import { Request, Response } from 'express';
import { runAgent } from '../agent';
import { sdkLogger } from '../logger';

export async function askSDKAgent(req: Request, res: Response) {
  const { question, stream, sessionId, userId } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'question is required (non-empty string)' });
  }

  sdkLogger.userQuery(question);

  const options = {
    sessionId: sessionId || req.headers['x-session-id'] as string || 'default-session',
    userId: userId || req.headers['x-user-id'] as string || 'default-user',
  };

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    try {
      const result = await runAgent(question.trim(), undefined, options);
      for (const chunk of result.answer.split(/(?<=\s)/)) {
        res.write(`data: ${JSON.stringify({ type: 'token', text: chunk })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({
        type: 'done',
        output: result.answer,
        iterations: result.iterations.length,
        latencyMs: result.totalLatencyMs,
        tokens: result.tokenUsage,
      })}\n\n`);
      res.end();
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
      res.end();
    }
  } else {
    try {
      const result = await runAgent(question.trim(), undefined, options);
      res.json({
        question: question.trim(),
        answer: result.answer,
        iterations: result.iterations.length,
        latencyMs: result.totalLatencyMs,
        tokens: result.tokenUsage,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Agent call failed' });
    }
  }
}
