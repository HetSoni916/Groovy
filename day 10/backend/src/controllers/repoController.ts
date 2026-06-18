import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { processRepo, getRepo, getSummary, listRepos } from '../services/repoService';
import { generateProjectDescription } from '../services/descriptionService';

export async function uploadRepo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Extract zip to temp directory
    const tempDir = path.join(require('os').tmpdir(), 'codebase-explainer', path.parse(file.originalname).name);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Since we accept a folder path directly (or zip), handle both
    const repo = await processRepo(file.originalname, file.path);
    res.status(201).json(repo);
  } catch (err) {
    next(err);
  }
}

export async function scanPath(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { repoPath, name } = req.body;
    if (!repoPath) {
      res.status(400).json({ error: 'repoPath is required' });
      return;
    }

    const resolvedPath = path.resolve(repoPath);
    if (!fs.existsSync(resolvedPath)) {
      res.status(404).json({ error: `Path not found: ${resolvedPath}` });
      return;
    }

    if (!fs.statSync(resolvedPath).isDirectory()) {
      res.status(400).json({ error: 'Path must be a directory' });
      return;
    }

    const repo = await processRepo(name || path.basename(resolvedPath), resolvedPath);
    res.status(201).json(repo);
  } catch (err) {
    next(err);
  }
}

export async function getRepoById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const repo = await getRepo(id);
    if (!repo) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }
    res.json(repo);
  } catch (err) {
    next(err);
  }
}

export async function getRepoSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const summary = await getSummary(id);
    if (!summary) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

export async function listAllRepos(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const repos = await listRepos();
    res.json(repos);
  } catch (err) {
    next(err);
  }
}

export async function getRepoFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const repo = await getRepo(id);
    if (!repo) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }
    const fileList = repo.files.map(f => ({
      id: f.id,
      path: f.path,
      language: f.language,
      summary: f.summary,
    }));
    res.json(fileList);
  } catch (err) {
    next(err);
  }
}

export async function getRepoDescription(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const repo = await getRepo(id);
    if (!repo) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }
    const description = await generateProjectDescription(repo);
    res.json({ description });
  } catch (err) {
    next(err);
  }
}

export async function getFileContent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const filePath = req.params[0];
    if (!filePath) {
      res.status(400).json({ error: 'File path is required' });
      return;
    }
    const repo = await getRepo(id);
    if (!repo) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }
    const file = repo.files.find(f => f.path === filePath);
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    res.type('text/plain').send(file.content);
  } catch (err) {
    next(err);
  }
}
