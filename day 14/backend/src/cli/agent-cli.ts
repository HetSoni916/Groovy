import * as readline from 'readline';
import { runAgent, tools } from '../services/agent.service';
import { generateThreadId } from '../agent/memory';

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

  console.log('--- Slack Webhook Test ---');
  if (process.env.SLACK_WEBHOOK_URL) {
    process.stdout.write('Sending test message... ');
    try {
      const r = await runAgent('Send a slack message saying "Hello from the 3-tool agent!"');
      const ok = r.includes('success') || r.includes('Slack');
      console.log(ok ? 'OK' : 'FAIL');
      console.log(`  ${r.substring(0, 200)}...\n`);
    } catch (e) {
      console.log('ERROR: ' + (e as Error).message);
    }
  } else {
    console.log('  SKIPPED (set SLACK_WEBHOOK_URL in .env to test)\n');
  }

  console.log('\n--- Ask My Notes Test ---');
  process.stdout.write('Testing RAG query... ');
  try {
    const r = await runAgent('What is the internship deadline in my notes?');
    const hasAnswer = r.length > 20 && !r.includes('Error');
    console.log(hasAnswer ? 'OK' : 'CHECK');
    console.log(`  ${r.substring(0, 200)}...\n`);
  } catch (e) {
    console.log('ERROR: ' + (e as Error).message);
  }

  console.log('\n--- Multi-Step Test ---');
  process.stdout.write('Testing multi-tool chain... ');
  try {
    const result = await runAgent(
      'Calculate 984 * 75, then send the result to Slack'
    );
    console.log('OK');
    console.log(`  ${result.substring(0, 300)}...\n`);
  } catch (e) {
    console.log('ERROR: ' + (e as Error).message);
  }

  console.log('All tests completed.');
}

async function runInteractive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('LangChain 4-Tool Agent: Calculator + Web Search + Slack + Ask My Notes');
  console.log('(type "exit" to quit, "test" for tests)\n');
  const history: any[] = [];
  const sessionId = `cli-session-langchain-${Date.now()}`;
  const userId = 'cli-user';
  console.log(`Using Session: ${sessionId}, User: ${userId}\n`);
  const ask = () => {
    rl.question('You: ', async (input) => {
      if (input.toLowerCase() === 'exit') { rl.close(); return; }
      if (input.toLowerCase() === 'test') { await runTests(); ask(); return; }
      try {
        const answer = await runAgent(input, undefined, { sessionId, userId });
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
