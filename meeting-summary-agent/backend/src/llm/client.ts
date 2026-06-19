import OpenAI from 'openai';
import { env } from '../config/env';
import { estimateCost } from '../utils/cost';
import { logger } from '../utils/logger';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function generateStructuredOutput<T>(args: {
  name: string;
  schema: Record<string, unknown>;
  prompt: string;
}): Promise<{ data: T; usage: { inputTokens: number; outputTokens: number; estimatedCost: number } }> {
  const response = await client.responses.create({
    model: env.OPENAI_MODEL,
    input: args.prompt,
    text: {
      format: {
        type: 'json_schema',
        name: args.name,
        strict: true,
        schema: args.schema,
      },
    },
  });

  const rawText = response.output_text;
  if (!rawText) {
    throw new Error('The LLM returned an empty response.');
  }

  let data: T;
  try {
    data = JSON.parse(rawText) as T;
  } catch (error) {
    logger.error('llm.invalid_json', { name: args.name, rawText, error: String(error) });
    throw new Error('The LLM returned malformed structured data.');
  }

  const inputTokens = response.usage?.input_tokens ?? 0;
  const outputTokens = response.usage?.output_tokens ?? 0;
  const estimatedCost = estimateCost(env.OPENAI_MODEL, inputTokens, outputTokens);

  logger.info('llm.response', { model: env.OPENAI_MODEL, name: args.name, inputTokens, outputTokens, estimatedCost });

  return { data, usage: { inputTokens, outputTokens, estimatedCost } };
}