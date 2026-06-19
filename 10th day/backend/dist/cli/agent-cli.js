"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const readline = __importStar(require("readline"));
const agent_service_1 = require("../services/agent.service");
async function runTests() {
    console.log('=== Running Tests ===\n');
    const tests = [
        { input: 'What is 15 + 27?', check: (r) => r.includes('42') },
        { input: 'Calculate 100 / 4', check: (r) => r.includes('25') },
        { input: 'What is 7 to the power of 3?', check: (r) => r.includes('343') },
        { input: 'Square root of 144', check: (r) => r.includes('12') },
        { input: 'What is 17 modulo 5?', check: (r) => r.includes('2') },
    ];
    let passed = 0;
    for (const t of tests) {
        process.stdout.write(`"${t.input}"... `);
        try {
            const result = await (0, agent_service_1.runAgent)(t.input);
            const ok = t.check(result);
            console.log(ok ? 'PASS' : 'FAIL');
            if (!ok)
                console.log(`  Got: ${result.substring(0, 100)}`);
            else
                passed++;
        }
        catch (e) {
            console.log('ERROR: ' + e.message);
        }
    }
    console.log(`\n${passed}/${tests.length} calculator tests passed`);
    console.log('\n--- Web Search Test ---');
    for (const q of ['Who is the current CEO of Tesla?', 'Latest Python version 2026']) {
        process.stdout.write(`"${q}"... `);
        try {
            const r = await (0, agent_service_1.runAgent)(q);
            console.log('OK');
            console.log(`  ${r.substring(0, 200)}...\n`);
        }
        catch (e) {
            console.log('ERROR: ' + e.message);
        }
    }
    console.log('--- Slack Webhook Test ---');
    if (process.env.SLACK_WEBHOOK_URL) {
        process.stdout.write('Sending test message... ');
        try {
            const r = await (0, agent_service_1.runAgent)('Send a slack message saying "Hello from the 3-tool agent!"');
            const ok = r.includes('success') || r.includes('Slack');
            console.log(ok ? 'OK' : 'FAIL');
            console.log(`  ${r.substring(0, 200)}...\n`);
        }
        catch (e) {
            console.log('ERROR: ' + e.message);
        }
    }
    else {
        console.log('  SKIPPED (set SLACK_WEBHOOK_URL in .env to test)\n');
    }
}
async function runInteractive() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log('3-Tool Agent: Calculator + Web Search + Slack (type "exit" to quit, "test" for tests)\n');
    const history = [];
    const ask = () => {
        rl.question('You: ', async (input) => {
            if (input.toLowerCase() === 'exit') {
                rl.close();
                return;
            }
            if (input.toLowerCase() === 'test') {
                await runTests();
                ask();
                return;
            }
            try {
                const answer = await (0, agent_service_1.runAgent)(input, history);
                console.log(`Agent: ${answer}\n`);
                history.push({ role: 'user', content: input });
                history.push({ role: 'assistant', content: answer });
            }
            catch (e) {
                console.log('Error:', e.message);
            }
            ask();
        });
    };
    ask();
}
const isTest = process.argv.includes('--test');
if (isTest) {
    runTests().catch(console.error);
}
else {
    runInteractive().catch(console.error);
}
//# sourceMappingURL=agent-cli.js.map