import { AIProvider, ChatMessage } from '../types';
import { config } from '../config';

export class CohereProvider implements AIProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = config.apiKeys.cohere;
    if (!this.apiKey) {
      console.warn('COHERE_API_KEY is not set. Cohere provider will fail.');
    }
  }

  async generateResponse(messages: ChatMessage[]): Promise<string> {
    const response = await fetch('https://api.cohere.com/v2/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'command-r-08-2024',
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Cohere API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    return data.message?.content?.[0]?.text || '';
  }
}
