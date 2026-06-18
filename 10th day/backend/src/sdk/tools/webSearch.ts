import { sdkLogger } from '../logger';

async function duckDuckGoSearch(query: string, maxResults = 5): Promise<string> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  const html = await res.text();

  const resultDivs = html.match(
    /<div[^>]*class="[^"]*result__body[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi
  ) || [];

  const results: string[] = [];
  for (const div of resultDivs) {
    const aTag = div.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
    const snippetTag = div.match(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
    const hrefMatch = div.match(/<a[^>]*href="([^"]*)"[^>]*class="[^"]*result__a[^"]*"/i);

    if (aTag) {
      const title = aTag[1].replace(/<[^>]*>/g, '').trim();
      const snippet = snippetTag ? snippetTag[1].replace(/<[^>]*>/g, '').trim() : '';
      const link = hrefMatch ? hrefMatch[1].replace(/^\/\/redirect\.duckduckgo\.com\//, '') : '';
      results.push(
        `- ${title}${snippet ? `: ${snippet}` : ''}${link ? ` (${decodeURIComponent(link)})` : ''}`
      );
      if (results.length >= maxResults) break;
    }
  }

  return results.length > 0
    ? `Search results for "${query}":\n${results.join('\n')}`
    : `No results found for "${query}"`;
}

export async function runWebSearch(query: string, maxResults?: number): Promise<string> {
  sdkLogger.toolCallGenerated('web_search', { query, maxResults });
  const max = Math.min(Math.max((maxResults || 5), 1), 10);
  return await duckDuckGoSearch(query, max);
}
