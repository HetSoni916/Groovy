import { ChromaClient } from 'chromadb';
import { Chunk } from '../types';

const COLLECTION_NAME = 'ask-my-notes';

export class VectorStore {
  private client: ChromaClient;
  private collection: any = null;

  constructor() {
    this.client = new ChromaClient({ host: 'localhost', port: 8000 });
  }

  private async getCollection(): Promise<any> {
    if (!this.collection) {
      const collections = await this.client.listCollections();
      const exists = collections.some((c: any) => c.name === COLLECTION_NAME);
      if (exists) {
        this.collection = await this.client.getCollection({ name: COLLECTION_NAME });
      } else {
        this.collection = await this.client.createCollection({ name: COLLECTION_NAME, metadata: { 'hnsw:space': 'cosine' } });
      }
    }
    return this.collection;
  }

  async addChunks(chunks: Chunk[], documentId: string, filenames: Map<string, string>): Promise<void> {
    const withEmbeddings = chunks.filter(c => c.embedding && c.embedding.length > 0);
    if (withEmbeddings.length === 0) return;

    const collection = await this.getCollection();

    const ids = withEmbeddings.map(c => c.id);
    const embeddings = withEmbeddings.map(c => c.embedding!);
    const metadatas = withEmbeddings.map(c => ({
      documentId,
      pageStart: c.pageStart,
      pageEnd: c.pageEnd,
      filename: filenames.get(documentId) || 'Unknown',
    }));
    const documents = withEmbeddings.map(c => c.content);

    await collection.add({ ids, embeddings, metadatas, documents });
  }

  async search(queryEmbedding: number[], topK: number = 15, documentIds?: string[]): Promise<{ chunk: Chunk; score: number }[]> {
    const collection = await this.getCollection();
    const where = documentIds && documentIds.length > 0
      ? { documentId: { $in: documentIds } }
      : undefined;

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      where,
    });

    if (!results.ids[0] || results.ids[0].length === 0) return [];

    return results.ids[0].map((id: string, i: number) => ({
      chunk: {
        id,
        documentId: results.metadatas[0][i].documentId,
        pageStart: results.metadatas[0][i].pageStart,
        pageEnd: results.metadatas[0][i].pageEnd,
        content: results.documents[0][i],
        tokenCount: 0,
      } as Chunk,
      score: results.distances ? 1 - results.distances[0][i] : 0,
    }));
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      const collection = await this.getCollection();
      await collection.delete({ where: { documentId } });
    } catch {
      // collection may not exist yet
    }
  }

  async count(): Promise<number> {
    try {
      const collection = await this.getCollection();
      return await collection.count();
    } catch {
      return 0;
    }
  }
}

export const vectorStore = new VectorStore();
