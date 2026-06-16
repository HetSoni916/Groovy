export function countTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

export function truncateToTokens(text: string, maxTokens: number): string {
  const words = text.split(/\s+/);
  const maxWords = Math.floor(maxTokens / 1.3);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ');
}
