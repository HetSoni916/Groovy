import { AIProvider, ChatMessage } from '../types';
import { config } from '../config';

export class GeminiProvider implements AIProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = config.apiKeys.gemini;
    if (!this.apiKey) {
      console.warn('GEMINI_API_KEY is not set. Gemini provider will fail.');
    }
  }

  async generateResponse(messages: ChatMessage[]): Promise<string> {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const contents: any[] = conversationMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body: any = {
      contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    };

    if (systemMessage) {
      body.systemInstruction = {
        parts: [{ text: systemMessage.content }],
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}
