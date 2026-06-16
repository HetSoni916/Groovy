import { Request, Response, NextFunction } from 'express';
import { getRepo } from '../services/repoService';
import { search, buildAnswer } from '../services/retrieval';
import { QueryRequest } from '../types';

export async function askQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { repoId, question, mode, provider } = req.body as QueryRequest;

    if (!repoId || !question) {
      res.status(400).json({ error: 'repoId and question are required' });
      return;
    }

    const repo = getRepo(repoId);
    if (!repo) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }

    const results = await search(question, repo, 5);
    if (results.length === 0) {
      res.json({
        answer: 'I could not find any relevant code in the repository to answer your question. Please try a different question or check if the repository was scanned correctly.',
        references: [],
        usage: { input: 0, output: 0, cost: 0 },
      });
      return;
    }

    const response = await buildAnswer(
      question,
      results,
      provider || 'groq',
      mode || 'beginner'
    );

    res.json(response);
  } catch (err) {
    next(err);
  }
}
