import OpenAI from 'openai';
import { env } from '../config/env.js';
import { log, logCost } from '../logger.js';

export class LLMClient {
  constructor() {
    this.provider = env.LLM_PROVIDER;
    this.client = null;
    this.model = '';

    this._initialize();
  }

  _initialize() {
    switch (this.provider) {
      case 'openai':
        if (!env.OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY is required when using OpenAI provider');
        }
        this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
        this.model = env.OPENAI_MODEL;
        log('LLM', `Initialized OpenAI client with model ${this.model}`);
        break;

      case 'groq':
        if (!env.GROQ_API_KEY) {
          throw new Error('GROQ_API_KEY is required when using Groq provider');
        }
        this.client = new OpenAI({
          apiKey: env.GROQ_API_KEY,
          baseURL: 'https://api.groq.com/openai/v1',
        });
        this.model = env.GROQ_MODEL;
        log('LLM', `Initialized Groq client with model ${this.model}`);
        break;

      case 'anthropic':
        log('LLM', 'Anthropic provider selected (OpenAI-compatible wrapper)');
        if (!env.ANTHROPIC_API_KEY) {
          throw new Error('ANTHROPIC_API_KEY is required when using Anthropic provider');
        }
        this.client = new OpenAI({
          apiKey: env.ANTHROPIC_API_KEY,
          baseURL: 'https://api.anthropic.com/v1',
        });
        this.model = env.ANTHROPIC_MODEL;
        break;

      default:
        throw new Error(`Unsupported LLM provider: ${this.provider}`);
    }
  }

  async chat(systemPrompt, userMessage, options = {}) {
    const startTime = Date.now();
    log('LLM', `Sending request to ${this.provider}/${this.model}`, 'DEBUG');

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 2000,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined,
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      const usage = response.usage;

      log('LLM', `Response received in ${elapsed}s`, 'DEBUG');

      const cost = logCost(
        this.provider,
        this.model,
        usage.prompt_tokens,
        usage.completion_tokens,
        usage.total_tokens
      );

      return {
        content: response.choices[0].message.content,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          costEstimate: cost.totalCost,
        },
      };
    } catch (error) {
      log('LLM', `Request failed: ${error.message}`, 'ERROR');
      throw new Error(`LLM request failed: ${error.message}`);
    }
  }
}
