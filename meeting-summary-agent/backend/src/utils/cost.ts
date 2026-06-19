const PRICE_TABLE: Record<string, { input: number; output: number }> = {
  'gpt-4.1-mini': { input: 0.4 / 1_000_000, output: 1.6 / 1_000_000 },
  'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
};

export function estimateCost(model: string, inputTokens = 0, outputTokens = 0): number {
  const prices = PRICE_TABLE[model] ?? PRICE_TABLE['gpt-4.1-mini'];
  return inputTokens * prices.input + outputTokens * prices.output;
}

export function formatMoney(value: number): string {
  return `$${value.toFixed(4)}`;
}