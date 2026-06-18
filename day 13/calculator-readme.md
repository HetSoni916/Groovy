# Calculator Agent — Day 14

An LLM-powered calculator that uses **function calling** (tool use) to perform arithmetic. The LLM decides which tool to call based on natural language input.

## How It Works

```
User: "What is 15 + 27?"

        │
        ▼
┌─────────────────────────────┐
│  LLM sees tool: add(a, b)   │
│  Decides to call it          │
│  Outputs: {"a": 15, "b": 27}│
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Agent executes add(15, 27) │
│  Returns: {"result": 42}    │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  LLM reads result,           │
│  responds with final answer  │
│  "Final answer: 42"          │
└─────────────────────────────┘
```

## Tools Available

| Tool | Description | Example |
|------|-------------|---------|
| `add(a, b)` | Add two numbers | `add(5, 3)` → 8 |
| `subtract(a, b)` | Subtract b from a | `subtract(10, 4)` → 6 |
| `multiply(a, b)` | Multiply two numbers | `multiply(6, 7)` → 42 |
| `divide(a, b)` | Divide a by b | `divide(100, 4)` → 25 |
| `power(base, exp)` | Raise base to exponent | `power(7, 3)` → 343 |
| `sqrt(x)` | Square root | `sqrt(144)` → 12 |
| `modulo(a, b)` | Remainder of a / b | `modulo(17, 5)` → 2 |

## Multi-Step Reasoning

For complex queries, the LLM chains multiple tool calls:

```
User: "Add 15 and 27, then multiply by 2"

Step 1: LLM calls add(15, 27) → 42
Step 2: LLM calls multiply(42, 2) → 84
Final:  "Final answer: 84"
```

## Test Results

```
"What is 15 + 27?"......... ✓ PASS  (42)
"Calculate 100 / 4"........ ✓ PASS  (25)
"What is 7 to the power of 3?" ✓ PASS  (343)
"Square root of 144"....... ✓ PASS  (12)
"What is 17 modulo 5?"..... ✓ PASS  (2)
```

## Usage

```bash
npm start        # Interactive mode
npm run test     # Run 5 automated tests
```

## Key Files

| File | Purpose |
|------|---------|
| `agent.ts` | Main agent — tool definitions, execution, Groq function calling loop |
| `package.json` | Dependencies (groq-sdk, dotenv, ts-node) |
| `.env` | GROQ_API_KEY |
| `tsconfig.json` | TypeScript config (commonjs) |

## What This Demonstrates

1. **Function calling** — LLM selects and calls tools with structured arguments
2. **Multi-step chains** — LLM can break complex problems into sequential tool calls
3. **Error handling** — Division by zero, negative sqrt are caught
4. **Tool feedback loop** — Each tool result is fed back to the LLM for the next step
