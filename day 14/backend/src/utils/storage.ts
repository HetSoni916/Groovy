import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';
import { Document, Page, Chunk, ChatEntry } from '../types';

export class StorageService {
  private docsPath: string;
  private pagesPath: string;
  private chunksPath: string;
  private chatsPath: string;

  constructor() {
    fs.mkdirSync(config.storageDir, { recursive: true });
    this.docsPath = path.join(config.storageDir, 'documents.json');
    this.pagesPath = path.join(config.storageDir, 'pages.json');
    this.chunksPath = path.join(config.storageDir, 'chunks.json');
    this.chatsPath = path.join(config.storageDir, 'chats.json');
    this.initFile(this.docsPath);
    this.initFile(this.pagesPath);
    this.initFile(this.chunksPath);
    this.initFile(this.chatsPath);
  }

  private initFile(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf-8');
    }
  }

  private read<T>(filePath: string): T[] {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      return [];
    }
  }

  private write<T>(filePath: string, data: T[]): void {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  saveDocument(doc: Document): void {
    const docs = this.read<Document>(this.docsPath);
    const idx = docs.findIndex(d => d.id === doc.id);
    if (idx >= 0) docs[idx] = doc;
    else docs.push(doc);
    this.write(this.docsPath, docs);
  }

  getDocuments(): Document[] {
    return this.read<Document>(this.docsPath);
  }

  getDocument(id: string): Document | undefined {
    return this.read<Document>(this.docsPath).find(d => d.id === id);
  }

  deleteDocument(id: string): void {
    const docs = this.read<Document>(this.docsPath).filter(d => d.id !== id);
    this.write(this.docsPath, docs);
    const pages = this.read<any>(this.pagesPath).filter((p: any) => p.documentId !== id);
    this.write(this.pagesPath, pages);
    const chunks = this.read<any>(this.chunksPath).filter((c: any) => c.documentId !== id);
    this.write(this.chunksPath, chunks);
  }

  savePage(page: Page & { documentId: string }): void {
    const pages = this.read<any>(this.pagesPath);
    pages.push(page);
    this.write(this.pagesPath, pages);
  }

  savePages(pages: (Page & { documentId: string })[]): void {
    const existing = this.read<any>(this.pagesPath);
    this.write(this.pagesPath, [...existing, ...pages]);
  }

  getPages(documentId: string): (Page & { documentId: string })[] {
    return this.read<any>(this.pagesPath).filter(p => p.documentId === documentId);
  }

  getAllPages(): (Page & { documentId: string })[] {
    return this.read<any>(this.pagesPath);
  }

  saveChunk(chunk: Chunk): void {
    const chunks = this.read<Chunk>(this.chunksPath);
    chunks.push(chunk);
    this.write(this.chunksPath, chunks);
  }

  saveChunks(chunks: Chunk[]): void {
    const existing = this.read<Chunk>(this.chunksPath);
    this.write(this.chunksPath, [...existing, ...chunks]);
  }

  getChunks(documentId?: string): Chunk[] {
    const all = this.read<Chunk>(this.chunksPath);
    return documentId ? all.filter(c => c.documentId === documentId) : all;
  }

  saveChat(entry: ChatEntry): void {
    const chats = this.read<ChatEntry>(this.chatsPath);
    chats.push(entry);
    this.write(this.chatsPath, chats);
  }

  getChatHistory(): ChatEntry[] {
    return this.read<ChatEntry>(this.chatsPath);
  }

  clearChatHistory(): void {
    this.write(this.chatsPath, []);
  }
}

export const storage = new StorageService();
