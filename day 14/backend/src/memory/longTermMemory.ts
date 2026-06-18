import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';
import { embeddingService } from '../services/embedding.service';
import { ChromaClient } from 'chromadb';
import { v4 as uuidv4 } from 'uuid';

const COLLECTION_NAME = 'long-term-memory';

export interface MemoryFact {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
  importance: number; // 1 to 10
  metadata?: Record<string, any>;
}

export class LongTermMemory {
  private factsFile: string;
  private chromaClient: ChromaClient;
  private collection: any = null;
  private chromaAvailable = false;

  constructor() {
    this.factsFile = path.join(config.storageDir, 'long_term_memories.json');
    this.chromaClient = new ChromaClient({ host: 'localhost', port: 8000 });
    this.initFile();
    this.initChroma().catch(err => {
      console.warn('[Memory] ChromaDB not available for long-term memory, using JSON fallback:', err.message);
    });
  }

  private initFile() {
    if (!fs.existsSync(config.storageDir)) {
      fs.mkdirSync(config.storageDir, { recursive: true });
    }
    if (!fs.existsSync(this.factsFile)) {
      fs.writeFileSync(this.factsFile, '[]', 'utf-8');
    }
  }

  private async initChroma() {
    try {
      const collections = await this.chromaClient.listCollections();
      const exists = collections.some((c: any) => c.name === COLLECTION_NAME);
      if (exists) {
        this.collection = await this.chromaClient.getCollection({ name: COLLECTION_NAME });
      } else {
        this.collection = await this.chromaClient.createCollection({
          name: COLLECTION_NAME,
          metadata: { 'hnsw:space': 'cosine' },
        });
      }
      this.chromaAvailable = true;
      console.log('[Memory] ChromaDB initialized successfully for long-term memory.');
    } catch (e) {
      this.chromaAvailable = false;
      throw e;
    }
  }

  private readAll(): MemoryFact[] {
    try {
      this.initFile();
      return JSON.parse(fs.readFileSync(this.factsFile, 'utf-8'));
    } catch {
      return [];
    }
  }

  private writeAll(facts: MemoryFact[]) {
    this.initFile();
    fs.writeFileSync(this.factsFile, JSON.stringify(facts, null, 2), 'utf-8');
  }

  async saveFact(userId: string, text: string, importance = 5, metadata: Record<string, any> = {}): Promise<MemoryFact> {
    const all = this.readAll();

    // Check if we already have this exact fact or a highly identical one to avoid duplicates
    const normalizedNew = text.toLowerCase().trim();
    const duplicate = all.find(f => f.userId === userId && f.text.toLowerCase().trim() === normalizedNew);
    if (duplicate) {
      console.log(`[Memory] Fact already exists: "${text}"`);
      return duplicate;
    }

    const newFact: MemoryFact = {
      id: uuidv4(),
      userId,
      text,
      timestamp: new Date().toISOString(),
      importance,
      metadata,
    };

    all.push(newFact);
    this.writeAll(all);

    // Try embedding & index to ChromaDB
    if (this.chromaAvailable || !this.collection) {
      try {
        if (!this.collection) {
          await this.initChroma();
        }
        const embedding = await embeddingService.generateEmbedding(text);
        await this.collection.add({
          ids: [newFact.id],
          embeddings: [embedding],
          metadatas: [{ userId, importance, timestamp: newFact.timestamp, ...metadata }],
          documents: [text],
        });
        console.log(`[Memory] Fact stored in ChromaDB: "${text}"`);
      } catch (err: any) {
        console.warn('[Memory] Failed to save fact to ChromaDB, saved in JSON fallback instead:', err.message);
      }
    } else {
      console.log(`[Memory] Fact stored in JSON fallback: "${text}"`);
    }

    return newFact;
  }

  async retrieveFacts(userId: string, query: string, limit = 5): Promise<MemoryFact[]> {
    console.log(`[Memory] Querying long-term memory for user ${userId}: "${query}"`);
    if (this.chromaAvailable || !this.collection) {
      try {
        if (!this.collection) {
          await this.initChroma();
        }
        const queryEmbedding = await embeddingService.generateEmbedding(query);
        const results = await this.collection.query({
          queryEmbeddings: [queryEmbedding],
          nResults: limit,
          where: { userId },
        });

        if (results.ids[0] && results.ids[0].length > 0) {
          const facts = results.ids[0].map((id: string, i: number) => {
            const meta = results.metadatas[0][i];
            return {
              id,
              userId: meta.userId,
              text: results.documents[0][i],
              timestamp: meta.timestamp || new Date().toISOString(),
              importance: meta.importance || 5,
              metadata: meta,
            } as MemoryFact;
          });
          return facts;
        }
      } catch (err: any) {
        console.warn('[Memory] Failed to query ChromaDB, falling back to substring search in JSON store:', err.message);
      }
    }

    // JSON fallback - word matching / substring matching
    const all = this.readAll();
    const userFacts = all.filter(f => f.userId === userId);
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    const scored = userFacts.map(f => {
      let score = 0;
      const textLower = f.text.toLowerCase();
      for (const w of words) {
        if (textLower.includes(w)) score += 1;
      }
      return { fact: f, score };
    });

    return scored
      .filter(s => s.score > 0 || query.length === 0)
      .sort((a, b) => b.score - a.score || b.fact.importance - a.fact.importance)
      .map(s => s.fact)
      .slice(0, limit);
  }

  deleteFact(id: string) {
    const all = this.readAll().filter(f => f.id !== id);
    this.writeAll(all);

    if (this.chromaAvailable && this.collection) {
      this.collection.delete({ ids: [id] }).catch((err: any) => {
        console.warn('[Memory] Failed to delete fact from Chroma:', err.message);
      });
    }
  }

  clearUserMemories(userId: string) {
    const all = this.readAll().filter(f => f.userId !== userId);
    this.writeAll(all);

    if (this.chromaAvailable && this.collection) {
      this.collection.delete({ where: { userId } }).catch((err: any) => {
        console.warn('[Memory] Failed to clear user memories from Chroma:', err.message);
      });
    }
  }
}

export const longTermMemory = new LongTermMemory();
