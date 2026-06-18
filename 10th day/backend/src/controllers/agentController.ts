import { Request, Response } from 'express';
import { runAgent } from '../services/agent.service';

export async function askAgent(req: Request, res: Response) {
  const { question } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'question is required (non-empty string)' });
  }

  try {
    const answer = await runAgent(question.trim());
    res.json({ question: question.trim(), answer });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Agent call failed' });
  }
}
