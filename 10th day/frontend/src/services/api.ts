import { Document, QueryResponse, PdfUploadResponse, ChatEntry } from '../types';

const API = '/api';

export async function uploadPdf(file: File): Promise<PdfUploadResponse> {
  const formData = new FormData();
  formData.append('pdf', file);
  const res = await fetch(`${API}/pdf/upload`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function listPdfs(): Promise<Document[]> {
  const res = await fetch(`${API}/pdf/list`);
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function deletePdf(id: string): Promise<void> {
  const res = await fetch(`${API}/pdf/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete document');
}

export async function askQuestion(question: string, documentIds?: string[]): Promise<QueryResponse> {
  const res = await fetch(`${API}/chat/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, documentIds }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function getChatHistory(): Promise<ChatEntry[]> {
  const res = await fetch(`${API}/chat/history`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export async function clearChatHistory(): Promise<void> {
  await fetch(`${API}/chat/history`, { method: 'DELETE' });
}
