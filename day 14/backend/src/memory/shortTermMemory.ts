import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';

export interface MemoryMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[];
  timestamp: string;
}

export class ShortTermMemory {
  private sessionsFile: string;

  constructor() {
    this.sessionsFile = path.join(config.storageDir, 'sessions_memory.json');
    this.initFile();
  }

  private initFile() {
    if (!fs.existsSync(config.storageDir)) {
      fs.mkdirSync(config.storageDir, { recursive: true });
    }
    if (!fs.existsSync(this.sessionsFile)) {
      fs.writeFileSync(this.sessionsFile, '{}', 'utf-8');
    }
  }

  private readAll(): Record<string, MemoryMessage[]> {
    try {
      this.initFile();
      return JSON.parse(fs.readFileSync(this.sessionsFile, 'utf-8'));
    } catch {
      return {};
    }
  }

  private writeAll(data: Record<string, MemoryMessage[]>) {
    this.initFile();
    fs.writeFileSync(this.sessionsFile, JSON.stringify(data, null, 2), 'utf-8');
  }

  getHistory(sessionId: string): MemoryMessage[] {
    const all = this.readAll();
    return all[sessionId] || [];
  }

  addMessage(sessionId: string, message: Omit<MemoryMessage, 'timestamp'>) {
    const all = this.readAll();
    if (!all[sessionId]) {
      all[sessionId] = [];
    }

    const newMessage: MemoryMessage = {
      ...message,
      timestamp: new Date().toISOString(),
    };

    all[sessionId].push(newMessage);

    // Limit short term memory to last 20 messages to keep context budget reasonable
    if (all[sessionId].length > 20) {
      all[sessionId] = all[sessionId].slice(all[sessionId].length - 20);
    }

    this.writeAll(all);
    console.log(`[Memory] Saved short-term message to session: ${sessionId}. Role: ${message.role}`);
  }

  clearSession(sessionId: string) {
    const all = this.readAll();
    delete all[sessionId];
    this.writeAll(all);
  }
}

export const shortTermMemory = new ShortTermMemory();
