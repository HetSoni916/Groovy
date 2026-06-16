export const pricing: Record<string, { inputCostPerMillionTokens: number; outputCostPerMillionTokens: number }> = {
  'llama-3.3-70b-versatile': {
    inputCostPerMillionTokens: 0.59,
    outputCostPerMillionTokens: 0.79,
  },
  'llama-3.1-8b-instant': {
    inputCostPerMillionTokens: 0.05,
    outputCostPerMillionTokens: 0.08,
  },
};

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string = 'llama-3.3-70b-versatile'
): number {
  const price = pricing[model as keyof typeof pricing] || { inputCostPerMillionTokens: 0.59, outputCostPerMillionTokens: 0.79 };
  const inputCost = (inputTokens / 1_000_000) * price.inputCostPerMillionTokens;
  const outputCost = (outputTokens / 1_000_000) * price.outputCostPerMillionTokens;
  return Math.round((inputCost + outputCost) * 100000) / 100000;
}
