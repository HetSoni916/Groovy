import * as readline from 'readline';
import { runAgent } from '../agent';
import { sdkLogger } from '../logger';
import { toolSchemas } from '../schemas';

async function runTests() {
  console.log('=== Running Pure SDK Agent Tests ===\n');
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
      const ok = t.check(result.answer);
      console.log(ok ? 'PASS' : 'FAIL');
      if (!ok) console.log(`  Got: ${result.answer.substring(0, 100)}`);
      else passed++;
      console.log(`  (${result.iterations.length} iterations, ${result.totalLatencyMs}ms)`);
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
      console.log(`  ${r.answer.substring(0, 200)}...\n`);
    } catch (e) {
      console.log('ERROR: ' + (e as Error).message);
    }
  }

  console.log('--- Slack Webhook Test ---');
  if (process.env.SLACK_WEBHOOK_URL) {
    process.stdout.write('Sending test message... ');
    try {
      const r = await runAgent('Send a slack message saying "Hello from the Pure SDK agent!"');
      const ok = r.answer.includes('success') || r.answer.includes('Slack');
      console.log(ok ? 'OK' : 'FAIL');
      console.log(`  ${r.answer.substring(0, 200)}...\n`);
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
    const hasAnswer = r.answer.length > 20 && !r.answer.includes('Error');
    console.log(hasAnswer ? 'OK' : 'CHECK');
    console.log(`  ${r.answer.substring(0, 200)}...\n`);
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
    console.log(`  ${result.answer.substring(0, 300)}...`);
    console.log(`  Iterations: ${result.iterations.length}, Latency: ${result.totalLatencyMs}ms\n`);
  } catch (e) {
    console.log('ERROR: ' + (e as Error).message);
  }

  console.log('\n=== All tests completed ===');
  console.log(`Session ID: ${sdkLogger.getSessionId()}`);
}

async function runInteractive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('Pure SDK 4-Tool Agent (Manual Reason → Act → Observe Loop)');
  console.log('Tools: calculator, web_search, send_slack_message, ask_my_notes');
  console.log('Framework: groq-sdk (no LangChain/LlamaIndex)');
  console.log('(type "exit" to quit, "test" for tests)\n');
  const history: { role: string; content: string }[] = [];
  const sessionId = `cli-session-${Date.now()}`;
  const userId = 'cli-user';
  console.log(`Using Session: ${sessionId}, User: ${userId}\n`);
  const ask = () => {
    rl.question('You: ', async (input) => {
      if (input.toLowerCase() === 'exit') { rl.close(); return; }
      if (input.toLowerCase() === 'test') { await runTests(); ask(); return; }
      try {
        const result = await runAgent(input, undefined, { sessionId, userId });
        console.log(`\nAgent: ${result.answer}\n`);
        console.log(`[${result.iterations.length} iterations, ${result.totalLatencyMs}ms, ${result.tokenUsage.total} tokens]\n`);
        history.push({ role: 'user', content: input });
        history.push({ role: 'assistant', content: result.answer });
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
