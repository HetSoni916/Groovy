import * as dotenv from 'dotenv';
import * as path from 'path';
import Groq from 'groq-sdk';
import * as readline from 'readline';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

type CalculatorArgs = Record<string, string | number>;

interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
  fn: (args: CalculatorArgs) => number;
}

const tools: Tool[] = [
  {
    name: 'add',
    description: 'Add two numbers together',
    parameters: {
      type: 'object',
      properties: {
        a: { type: 'number', description: 'First number' },
        b: { type: 'number', description: 'Second number' },
      },
      required: ['a', 'b'],
    },
    fn: (args) => (args.a as number) + (args.b as number),
  },
  {
    name: 'subtract',
    description: 'Subtract the second number from the first',
    parameters: {
      type: 'object',
      properties: {
        a: { type: 'number', description: 'Number to subtract from' },
        b: { type: 'number', description: 'Number to subtract' },
      },
      required: ['a', 'b'],
    },
    fn: (args) => (args.a as number) - (args.b as number),
  },
  {
    name: 'multiply',
    description: 'Multiply two numbers',
    parameters: {
      type: 'object',
      properties: {
        a: { type: 'number', description: 'First number' },
        b: { type: 'number', description: 'Second number' },
      },
      required: ['a', 'b'],
    },
    fn: (args) => (args.a as number) * (args.b as number),
  },
  {
    name: 'divide',
    description: 'Divide the first number by the second',
    parameters: {
      type: 'object',
      properties: {
        a: { type: 'number', description: 'Dividend' },
        b: { type: 'number', description: 'Divisor' },
      },
      required: ['a', 'b'],
    },
    fn: (args) => {
      if ((args.b as number) === 0) throw new Error('Division by zero');
      return (args.a as number) / (args.b as number);
    },
  },
  {
    name: 'power',
    description: 'Raise the base to the exponent',
    parameters: {
      type: 'object',
      properties: {
        base: { type: 'number', description: 'The base number' },
        exp: { type: 'number', description: 'The exponent' },
      },
      required: ['base', 'exp'],
    },
    fn: (args) => Math.pow(args.base as number, args.exp as number),
  },
  {
    name: 'sqrt',
    description: 'Calculate the square root of a number',
    parameters: {
      type: 'object',
      properties: {
        x: { type: 'number', description: 'The number to find the square root of' },
      },
      required: ['x'],
    },
    fn: (args) => {
      if ((args.x as number) < 0) throw new Error('Cannot calculate square root of negative number');
      return Math.sqrt(args.x as number);
    },
  },
  {
    name: 'modulo',
    description: 'Calculate the remainder of a divided by b',
    parameters: {
      type: 'object',
      properties: {
        a: { type: 'number', description: 'Dividend' },
        b: { type: 'number', description: 'Divisor' },
      },
      required: ['a', 'b'],
    },
    fn: (args) => (args.a as number) % (args.b as number),
  },
];

function toolToFunctionSpec(t: Tool) {
  return {
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  };
}

function executeTool(name: string, args: CalculatorArgs): string {
  const tool = tools.find(t => t.name === name);
  if (!tool) return `Error: unknown tool "${name}"`;
  try {
    const result = tool.fn(args);
    return JSON.stringify({ result, tool: name, args });
  } catch (e: any) {
    return JSON.stringify({ error: e.message, tool: name, args });
  }
}

async function runAgent(userInput: string, history: any[] = []): Promise<string> {
  const messages: any[] = [
    {
      role: 'system',
      content:
        'You are a calculator agent. Use the available tools to perform calculations. ' +
        'For multi-step problems, call one tool at a time, get the result, then call the next. ' +
        'Explain what you are doing at each step. ' +
        'When you have the final answer, respond with "Final answer: <number>".',
    },
    ...history,
    { role: 'user', content: userInput },
  ];

  const totalIterations = 0;

  while (true) {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      tools: tools.map(toolToFunctionSpec),
      tool_choice: 'auto',
    });

    const msg = response.choices[0]?.message;
    if (!msg) return 'No response from LLM';

    messages.push(msg);

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return msg.content || 'Done';
    }

    for (const call of msg.tool_calls) {
      const name = call.function.name;
      const args = JSON.parse(call.function.arguments);
      const result = executeTool(name, args);
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: result,
      });
    }
  }
}

async function runTests() {
  const tests = [
    { input: 'What is 15 + 27?', check: (r: string) => r.includes('42') },
    { input: 'Calculate 100 / 4', check: (r: string) => r.includes('25') },
    { input: 'What is 7 to the power of 3?', check: (r: string) => r.includes('343') },
    { input: 'Square root of 144', check: (r: string) => r.includes('12') },
    { input: 'What is 17 modulo 5?', check: (r: string) => r.includes('2') },
  ];

  console.log('=== Running Tests ===\n');
  let passed = 0;
  for (const t of tests) {
    process.stdout.write(`"${t.input}"... `);
    try {
      const result = await runAgent(t.input);
      const ok = t.check(result);
      console.log(ok ? '✓ PASS' : '✗ FAIL');
      if (!ok) console.log(`  Got: ${result.substring(0, 100)}`);
      else passed++;
    } catch (e) {
      console.log('✗ ERROR: ' + (e as Error).message);
    }
  }
  console.log(`\n${passed}/${tests.length} tests passed`);
}

async function runInteractive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('Calculator Agent (type "exit" to quit, "test" to run tests)\n');

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
if (isTest) {
  runTests().catch(console.error);
} else {
  runInteractive().catch(console.error);
}
