import { config } from '../config';
import { countTokens } from '../utils/tokenizer';
import { calculateCost } from '../utils/pricing';

const MODEL = 'llama-3.3-70b-versatile';

export class GroqService {
  async generateResponse(
    systemPrompt: string,
    context: string,
    question: string
  ): Promise<{ answer: string; usage: { inputTokens: number; outputTokens: number; totalTokens: number; cost: number; latencyMs: number; model: string } }> {
    if (!config.groqApiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const userContent = `CONTEXT FROM NOTES:\n${context}\n\n---\n\nQUESTION: ${question}`;
    const inputTokens = countTokens(systemPrompt) + countTokens(userContent);

    const startTime = Date.now();

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.groqApiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errorBody}`);
    }

    const data: any = await response.json();
    const answer = data.choices?.[0]?.message?.content || '';

    const outputTokens = countTokens(answer);
    const totalTokens = inputTokens + outputTokens;
    const cost = calculateCost(inputTokens, outputTokens, MODEL);

    return {
      answer,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
        cost,
        latencyMs,
        model: MODEL,
      },
    };
  }
}

export const groqService = new GroqService();
