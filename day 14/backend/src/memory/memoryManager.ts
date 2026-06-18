import { shortTermMemory, MemoryMessage } from './shortTermMemory';
import { longTermMemory, MemoryFact } from './longTermMemory';
import { countTokens } from '../utils/tokenizer';
import { config } from '../config';

export class MemoryManager {
  /**
   * Inject long-term relevant context facts into the base system prompt.
   */
  async getSystemPromptWithMemory(userId: string, query: string, baseSystemPrompt: string): Promise<string> {
    try {
      const relevantFacts = await longTermMemory.retrieveFacts(userId, query, 5);
      if (relevantFacts.length === 0) {
        return baseSystemPrompt;
      }

      const factsText = relevantFacts.map(f => `- ${f.text}`).join('\n');
      const memoryContext = `\n\n## User Profile & Stored Memories\nBelow are some persistent facts, preferences, and details you remember about this user:\n${factsText}\n\nUse this information when relevant to customize your answers, tool arguments, or style. Avoid referencing the fact store directly unless asked, just silently act on it.`;
      
      return baseSystemPrompt + memoryContext;
    } catch (err: any) {
      console.warn('[Memory] Failed to construct system prompt with memory:', err.message);
      return baseSystemPrompt;
    }
  }

  /**
   * Save user/assistant messages to short-term memory.
   */
  saveShortTermMessage(sessionId: string, role: 'user' | 'assistant' | 'system' | 'tool', content: string, extra?: Partial<MemoryMessage>) {
    shortTermMemory.addMessage(sessionId, {
      role,
      content,
      ...extra,
    });
  }

  /**
   * Retrieve session history.
   */
  getShortTermHistory(sessionId: string): MemoryMessage[] {
    return shortTermMemory.getHistory(sessionId);
  }

  /**
   * Clears short term session.
   */
  clearShortTermSession(sessionId: string) {
    shortTermMemory.clearSession(sessionId);
  }

  /**
   * Extract potential persistent facts from user inputs or agent outputs, then save them.
   */
  async autoExtractAndSaveFact(userId: string, userText: string, assistantText: string): Promise<void> {
    try {
      // Analyze text for preference/fact cues
      // We will perform a simple rule-based heuristics to look for keywords of facts, e.g. "I am X", "My X is Y", "I prefer X", "Remember X", "My favorite X is Y", etc.
      // Alternatively, we could run a fast LLM call. Let's make a call to Ollama or Groq to do clean extraction!
      const systemPrompt = `You are a memory processor assistant. Your task is to extract important user preferences, personal details (like names, roles, teams, favorite technologies), or facts from a dialogue turn.
      
      RULES:
      - Extract facts expressed directly by the user or assistant confirmations.
      - Output ONLY a JSON array of strings of clean, single facts in third-person, e.g., ["User's name is John Soni", "User prefers concise bullet-point reports", "User's Slack channel is engineering-team"].
      - Return an empty array [] if there is no important permanent preference/fact to remember.
      - Never extract temporary status or short-lived actions (e.g. "User wants to do task X today").
      - Only output valid JSON. No other text.`;

      const userTurn = `User message: "${userText}"\nAssistant response: "${assistantText}"`;

      const provider = (process.env.LLM_PROVIDER || 'ollama').toLowerCase();
      let responseText = '';

      if (provider === 'groq' && config.groqApiKey) {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.groqApiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userTurn },
            ],
            temperature: 0.1,
            max_tokens: 500,
          }),
        });
        if (response.ok) {
          const data = await response.json() as any;
          responseText = data.choices?.[0]?.message?.content || '[]';
        }
      } else {
        const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        const model = process.env.OLLAMA_MODEL || 'llama3.2:3b';
        const response = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userTurn },
            ],
            stream: false,
            options: { temperature: 0.1, num_predict: 500 },
          }),
        });
        if (response.ok) {
          const data = await response.json() as any;
          responseText = data.message?.content || '[]';
        }
      }

      // Try to parse JSON array of facts
      const match = responseText.match(/\[[\s\S]*\]/);
      if (match) {
        const facts: string[] = JSON.parse(match[0]);
        for (const fact of facts) {
          if (typeof fact === 'string' && fact.trim().length > 3) {
            // Check fact importance: facts about slack/webhook/name = high (8), generic preference = medium (5)
            let importance = 5;
            const textLower = fact.toLowerCase();
            if (textLower.includes('slack') || textLower.includes('webhook') || textLower.includes('email') || textLower.includes('name is')) {
              importance = 8;
            }
            await longTermMemory.saveFact(userId, fact.trim(), importance);
          }
        }
      }
    } catch (err: any) {
      console.warn('[Memory] autoExtractAndSaveFact failed (non-blocking):', err.message);
    }
  }
}

export const memoryManager = new MemoryManager();
