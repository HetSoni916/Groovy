import { AIProvider, ChatMessage } from '../types';
import { config } from '../config';

export class GroqProvider implements AIProvider {
  private apiKey: string;
  private apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor() {
    this.apiKey = config.apiKeys.groq;
    if (!this.apiKey) {
      console.warn('GROQ_API_KEY is not set. Groq provider will fail.');
    }
  }

  async generateResponse(messages: ChatMessage[]): Promise<string> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}
