import * as dotenv from 'dotenv';
import * as path from 'path';
import Groq from 'groq-sdk';
import * as readline from 'readline';

dotenv.config({ path: path.resolve(__dirname, '.env') });

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

function parseFailedGeneration(text: string): { name: string; args: ToolArgs } | null {
  const m = text.match(/<function=(\w+)[\s{]*({.*?})[\s}]*<\/function>/);
  if (m) {
    try {
      return { name: m[1], args: JSON.parse(m[2]) };
    } catch { }
  }
  const m2 = text.match(/<function=(\w+)[\s(]*({.*?})[\s)]*>/);
  if (m2) {
    try {
      return { name: m2[1], args: JSON.parse(m2[2]) };
    } catch { }
  }
  return null;
}

async function runAgent(userInput: string, history: any[] = []): Promise<string> {
  const messages: any[] = [
    {
      role: 'system',
      content:
        'You are a helpful agent with access to calculator and web search tools.\n\n' +
        'For calculations: use add, subtract, multiply, divide, power, sqrt, modulo.\n' +
        'For current info: use web_search and summarize the results.\n' +
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

async function runTests() {
  console.log('=== Running Tests ===\n');
  const tests = [
    { input: 'What is 15 + 27?', check: (r: string) => r.includes('42') },
    { input: 'Calculate 100 / 4', check: (r: string) => r.includes('25') },
    { input: 'What is 7 to the power of 3?', check: (r: string) => r.includes('343') },
    { input: 'Square root of 144', check: (r: string) => r.includes('12') },
    { input: 'What is 17 modulo 5?', check: (r: string) => r.includes('2') },
  ];

  let passed = 0;
  for (const t of tests) {
    process.stdout.write(`"${t.input}"... `);
    try {
      const result = await runAgent(t.input);
      const ok = t.check(result);
      console.log(ok ? 'PASS' : 'FAIL');
      if (!ok) console.log(`  Got: ${result.substring(0, 100)}`);
      else passed++;
    } catch (e) {
      console.log('ERROR: ' + (e as Error).message);
    }
  }
  console.log(`\n${passed}/${tests.length} calculator tests passed`);

  console.log('\n--- Web Search Test ---');
  for (const q of ['Who is the current CEO of Tesla?', 'Latest Python version 2026']) {
    process.stdout.write(`"${q}"... `);
    try {
      const r = await runAgent(q);
      console.log('OK');
      console.log(`  ${r.substring(0, 200)}...\n`);
    } catch (e) {
      console.log('ERROR: ' + (e as Error).message);
    }
  }
}

async function runInteractive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('Calculator + Web Search Agent (type "exit" to quit, "test" for tests)\n');
  const history: any[] = [];
  const ask = () => {
    rl.question('You: ', async (input) => {
      if (input.toLowerCase() === 'exit') { rl.close(); return; }
      if (input.toLowerCase() === 'test') { await runTests(); ask(); return; }
      try {
        const answer = await runAgent(input, history);
        console.log(`Agent: ${answer}\n`);
        history.push({ role: 'user', content: input });
        history.push({ role: 'assistant', content: answer });
      } catch (e) {
        console.log('Error:', (e as Error).message);
      }
      ask();
    });
  };
  ask();
}

const isTest = process.argv.includes('--test');
if (isTest) { runTests().catch(console.error); } else { runInteractive().catch(console.error); }
