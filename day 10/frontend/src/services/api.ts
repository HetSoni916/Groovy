import { Repository, RepoSummary, QueryResponse, FileInfo } from '../types';

const API = '/api';

function makeUrl(path: string): string {
  const base = `${API}${path}`;
  // The backend serves at /api/*, Vite proxies /api to localhost:3001
  return base;
}

export async function uploadRepo(path: string): Promise<Repository> {
  const res = await fetch(makeUrl('/repos/upload'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoPath: path }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function getRepo(id: string): Promise<Repository> {
  const res = await fetch(`${API}/repos/${id}`);
  if (!res.ok) throw new Error('Repo not found');
  return res.json();
}

export async function getRepoSummary(id: string): Promise<RepoSummary> {
  const res = await fetch(`${API}/repos/${id}/summary`);
  if (!res.ok) throw new Error('Summary not found');
  return res.json();
}

export async function getRepoFiles(id: string): Promise<FileInfo[]> {
  const res = await fetch(`${API}/repos/${id}/files`);
  if (!res.ok) throw new Error('Files not found');
  return res.json();
}

export async function getFileContent(id: string, path: string): Promise<string> {
  const res = await fetch(`${API}/repos/${id}/files/${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error('File not found');
  return res.text();
}

export async function askQuestion(
  repoId: string,
  question: string,
  mode: string,
  provider: string
): Promise<QueryResponse> {
  const res = await fetch(`${API}/chat/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoId, question, mode, provider }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
