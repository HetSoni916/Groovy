import { AIProvider } from '../types';
import { GroqProvider } from './groq';
import { GeminiProvider } from './gemini';
import { CohereProvider } from './cohere';

const providers: Record<string, new () => AIProvider> = {
  groq: GroqProvider,
  gemini: GeminiProvider,
  cohere: CohereProvider,
};

export function getProvider(name?: string): AIProvider {
  const providerName = (name || 'groq').toLowerCase();
  const ProviderClass = providers[providerName];
  if (!ProviderClass) {
    console.warn(`Unknown provider "${name}", falling back to groq`);
    return new GroqProvider();
  }
  return new ProviderClass();
}
