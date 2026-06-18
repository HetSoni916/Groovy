import { MemoryManager } from './memoryManager';
import { MemoryResult } from './types';

export class MemoryRetriever {
  private memoryManager: MemoryManager | null = null;

  constructor(mgr?: MemoryManager) {
    if (mgr) this.memoryManager = mgr;
  }

  private getManager(): MemoryManager {
    if (!this.memoryManager) {
      const { memoryManager: mm } = require('./memoryManager');
      this.memoryManager = mm;
    }
    return this.memoryManager;
  }

  async buildMemoryContext(userId: string, sessionId: string, userInput: string): Promise<string> {
    const parts: string[] = [];

    try {
      const context = await this.getManager().getContext(sessionId, userId, userInput);

      if (context.relevantFacts.length > 0) {
        const factsSection = this.formatFacts(context.relevantFacts);
        if (factsSection) parts.push(factsSection);
      }

      if (context.summary) {
        parts.push(`[Previous conversation context: ${context.summary}]`);
      }

      if (context.conversationHistory.length > 0) {
        const recentHistory = context.conversationHistory.slice(-6);
        const historyPreview = recentHistory
          .filter(e => e.role !== 'tool')
          .map(e => `[${e.role.toUpperCase()}]: ${e.content.substring(0, 200)}`)
          .join('\n');
        if (historyPreview) {
          parts.push(`[Recent conversation history]:\n${historyPreview}`);
        }
      }
    } catch {
      parts.push('[Memory system unavailable]');
    }

    return parts.join('\n\n');
  }

  async buildSystemPromptInjection(userId: string, sessionId: string, userInput: string): Promise<string> {
    return this.buildMemoryContext(userId, sessionId, userInput);
  }

  private formatFacts(facts: MemoryResult[]): string {
    if (facts.length === 0) return '';

    const lines: string[] = ['## Remembered Information'];
    for (const r of facts) {
      const icon = this.categoryIcon(r.fact.category);
      lines.push(`- ${icon} ${r.fact.content}`);
    }
    return lines.join('\n');
  }

  private categoryIcon(category: string): string {
    switch (category) {
      case 'preference': return '[Preference]';
      case 'fact': return '[Fact]';
      case 'relationship': return '[Relation]';
      case 'routine': return '[Routine]';
      default: return '[Note]';
    }
  }
}

export const memoryRetriever = new MemoryRetriever();
