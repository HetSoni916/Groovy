import { config } from '../config';
import { countTokens } from '../utils/tokenizer';
import { calculateCost } from '../utils/pricing';

const GROQ_MODEL = 'llama-3.3-70b-versatile';

async function callOllama(systemPrompt: string, userContent: string): Promise<any> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.2:3b';
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      stream: false,
      options: { temperature: 0.3, num_predict: 4096 },
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama error (${response.status}): ${body}`);
  }
  return response.json();
}

async function callGroq(systemPrompt: string, userContent: string): Promise<any> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.groqApiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorBody}`);
  }
  return response.json();
}

export class GroqService {
  async generateResponse(
    systemPrompt: string,
    context: string,
    question: string
  ): Promise<{ answer: string; usage: { inputTokens: number; outputTokens: number; totalTokens: number; cost: number; latencyMs: number; model: string } }> {
    const userContent = `CONTEXT FROM NOTES:\n${context}\n\n---\n\nQUESTION: ${question}`;
    const inputTokens = countTokens(systemPrompt) + countTokens(userContent);
    const startTime = Date.now();

    const provider = (process.env.LLM_PROVIDER || 'ollama').toLowerCase();
    let answer: string;
    let model: string;

    if (provider === 'groq') {
      if (!config.groqApiKey) throw new Error('GROQ_API_KEY is not configured');
      const data = await callGroq(systemPrompt, userContent);
      answer = data.choices?.[0]?.message?.content || '';
      model = GROQ_MODEL;
    } else {
      const data = await callOllama(systemPrompt, userContent);
      answer = data.message?.content || '';
      model = data.model || process.env.OLLAMA_MODEL || 'llama3.2:3b';
    }

    const latencyMs = Date.now() - startTime;
    const outputTokens = countTokens(answer);
    const totalTokens = inputTokens + outputTokens;
    const cost = calculateCost(inputTokens, outputTokens, model);

    return {
      answer,
      usage: { inputTokens, outputTokens, totalTokens, cost, latencyMs, model },
    };
  }
}

export const groqService = new GroqService();
