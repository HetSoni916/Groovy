import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

type ToolArgs = Record<string, string | number>;

interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
  fn: (args: ToolArgs) => number | string | Promise<number | string>;
}

async function sendSlackMessage(message: string, webhookUrl?: string): Promise<string> {
  const url = webhookUrl || process.env.SLACK_WEBHOOK_URL;
  if (!url) return JSON.stringify({ error: 'No Slack webhook URL configured. Set SLACK_WEBHOOK_URL in .env or pass webhook_url.' });
  if (!message.trim()) return JSON.stringify({ error: 'Message cannot be empty' });
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  });
  if (!res.ok) {
    const body = await res.text();
    return JSON.stringify({ error: `Slack returned ${res.status}: ${body}` });
  }
  return JSON.stringify({ success: true, message: `Sent to Slack: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"` });
}

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

const tools: Tool[] = [
  { name: 'add', description: 'Add two numbers together',
    parameters: { type: 'object', properties: { a: { type: 'number', description: 'First number' }, b: { type: 'number', description: 'Second number' } }, required: ['a', 'b'] },
    fn: (args) => (args.a as number) + (args.b as number) },
  { name: 'subtract', description: 'Subtract the second number from the first',
    parameters: { type: 'object', properties: { a: { type: 'number', description: 'Number to subtract from' }, b: { type: 'number', description: 'Number to subtract' } }, required: ['a', 'b'] },
    fn: (args) => (args.a as number) - (args.b as number) },
  { name: 'multiply', description: 'Multiply two numbers',
    parameters: { type: 'object', properties: { a: { type: 'number', description: 'First number' }, b: { type: 'number', description: 'Second number' } }, required: ['a', 'b'] },
    fn: (args) => (args.a as number) * (args.b as number) },
  { name: 'divide', description: 'Divide the first number by the second',
    parameters: { type: 'object', properties: { a: { type: 'number', description: 'Dividend' }, b: { type: 'number', description: 'Divisor' } }, required: ['a', 'b'] },
    fn: (args) => { if ((args.b as number) === 0) throw new Error('Division by zero'); return (args.a as number) / (args.b as number); } },
  { name: 'power', description: 'Raise the base to the exponent',
    parameters: { type: 'object', properties: { base: { type: 'number', description: 'The base number' }, exp: { type: 'number', description: 'The exponent' } }, required: ['base', 'exp'] },
    fn: (args) => Math.pow(args.base as number, args.exp as number) },
  { name: 'sqrt', description: 'Calculate the square root of a number',
    parameters: { type: 'object', properties: { x: { type: 'number', description: 'The number to find the square root of' } }, required: ['x'] },
    fn: (args) => { if ((args.x as number) < 0) throw new Error('Cannot calculate square root of negative number'); return Math.sqrt(args.x as number); } },
  { name: 'modulo', description: 'Calculate the remainder of a divided by b',
    parameters: { type: 'object', properties: { a: { type: 'number', description: 'Dividend' }, b: { type: 'number', description: 'Divisor' } }, required: ['a', 'b'] },
    fn: (args) => (args.a as number) % (args.b as number) },
  { name: 'web_search', description: 'Search the web for current information. Use this for up-to-date facts, news, or anything beyond general knowledge.',
    parameters: { type: 'object', properties: { query: { type: 'string', description: 'The search query' }, max_results: { type: 'number', description: 'Max results (1-10)' } }, required: ['query'] },
    fn: async (args) => { const q = args.query as string; const max = Math.min(Math.max((args.max_results as number) || 5, 1), 10); return await duckDuckGoSearch(q, max); } },
  { name: 'send_slack_message', description: 'Send a message to a Slack channel via webhook. Requires SLACK_WEBHOOK_URL in .env or pass webhook_url.',
    parameters: { type: 'object', properties: { message: { type: 'string', description: 'The message text to send to Slack' }, webhook_url: { type: 'string', description: 'Optional override Slack webhook URL' } }, required: ['message'] },
    fn: async (args) => { const msg = args.message as string; const wh = args.webhook_url as string | undefined; return await sendSlackMessage(msg, wh); } },
];

function toolToFunctionSpec(t: Tool) {
  return { type: 'function' as const, function: { name: t.name, description: t.description, parameters: t.parameters } };
}

async function executeTool(name: string, args: ToolArgs): Promise<string> {
  const tool = tools.find(t => t.name === name);
  if (!tool) return JSON.stringify({ error: `unknown tool "${name}"` });
  try {
    const result = await tool.fn(args);
    return JSON.stringify({ result, tool: name, args });
  } catch (e: any) {
    return JSON.stringify({ error: e.message, tool: name, args });
  }
}

export async function runAgent(userInput: string, history: any[] = []): Promise<string> {
  const messages: any[] = [
    {
      role: 'system',
      content:
        'You are a helpful agent with access to calculator, web search, and Slack tools.\n\n' +
        'For calculations: use add, subtract, multiply, divide, power, sqrt, modulo.\n' +
        'For current info: use web_search and summarize the results.\n' +
        'To send a Slack notification: use send_slack_message.\n' +
        'Chain multiple tool calls for multi-step problems.\n' +
        'When you have the answer, respond with "Final answer: <answer>".',
    },
    ...history,
    { role: 'user', content: userInput },
  ];

  while (true) {
    let msg: any;

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        tools: tools.map(toolToFunctionSpec),
        tool_choice: 'auto',
      });
      msg = response.choices[0]?.message;
      if (!msg) return 'No response from LLM';
    } catch (err: any) {
      messages.push({
        role: 'user',
        content: 'Respond with just the final answer. Format: "Final answer: <number>". Do not use any functions.',
      });
      const retry = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
      });
      return retry.choices[0]?.message?.content || 'No response';
    }

    messages.push(msg);

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return msg.content || 'Done';
    }

    for (const call of msg.tool_calls) {
      const args = JSON.parse(call.function.arguments);
      const result = await executeTool(call.function.name, args);
      messages.push({ role: 'tool', tool_call_id: call.id, content: result });
    }
  }
}
