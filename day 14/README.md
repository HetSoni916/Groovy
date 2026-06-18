# Day 14: Three AI Agents — LangChain, LlamaIndex & Pure SDK

## Task Prompts

### Prompt 1: LangChain Agent

> Convert the existing Day 12 and Day 13 systems into a single LangChain-powered Agentic AI Assistant without removing any existing functionality, by reusing the current implementations and refactoring them into LangChain tools. Replace the manual Groq tool loop with LangChain's AgentExecutor. The agent should understand user requests, decide which tools are needed, execute one or multiple tools in sequence, observe tool results, continue reasoning until the final answer is ready, maintain conversation history, and support streaming responses.

### Prompt 2: LlamaIndex Agent

> Build the existing AI agent using LlamaIndex instead of LangChain. Create a LlamaIndex-based agent that can use multiple tools, perform reasoning, and execute the correct tools based on the user's request. Use the latest LlamaIndex Agent framework and Query Engine. Implement the existing tools as LlamaIndex FunctionTools.

### Prompt 3: Pure SDK Agent (Manual Loop)

> Build the same agent using only a pure LLM SDK without using any frameworks like LangChain, LlamaIndex, or any agent orchestration library. Implement the complete Reason → Act → Observe loop manually using the native Groq SDK. Reuse the existing business logic for all tools. The manual loop should support multiple iterations and multiple tool calls for a single user request.

---

## Three Implementations — One Backend

The project now has **three parallel agent implementations**, all sharing the same underlying services (ChromaDB, embeddings, retrieval, LLM):

| # | Agent | Framework | Agent Type | Tool Type | LLM Integration | Location |
|---|-------|-----------|------------|-----------|-----------------|----------|
| 1 | **LangChain** | `@langchain/core`, `langchain` | `createReactAgent` (LangGraph) | `DynamicStructuredTool` (Zod) | `@langchain/groq`, `@langchain/ollama` | `src/agent/` + `src/tools/` |
| 2 | **LlamaIndex** | `llamaindex` | `ReActAgent` | `FunctionTool` (JSON Schema) | `@llamaindex/groq`, `@llamaindex/ollama` | `src/llama/` |
| 3 | **Pure SDK** | `groq-sdk` (no framework) | Manual Reason→Act→Observe loop | JSON Schema + executor | Groq SDK + Ollama REST API | `src/sdk/` |

---

## Architecture Comparison

### 1. LangChain Agent (`src/agent/` + `src/tools/`)

```
User Query → LangGraph ReactAgent → Tool Selection → Execute → Observe → Loop → Final Answer
                                       │
                              ┌────────┼────────┬──────────┬──────────────┐
                              ▼        ▼        ▼          ▼              │
                          Calculator  Web    Slack    Ask My Notes ───────┘
                          (LangChain DynamicStructuredTool with Zod)
```

- Uses `createReactAgent` from LangGraph with `MemorySaver` checkpointer
- 4 `DynamicStructuredTool`s with Zod schema validation
- SSE streaming via `runAgentExecutorStream()`
- Conversation memory via LangGraph checkpointer

### 2. LlamaIndex Agent (`src/llama/`)

```
User Query → ReActAgent → Tool Selection → Execute → Observe → Loop → Final Answer
                               │
                      ┌────────┼────────┬──────────┬──────────────┐
                      ▼        ▼        ▼          ▼              │
                  Calculator  Web    Slack    Ask My Notes ───────┘
                  (LlamaIndex FunctionTool with JSON Schema)
```

- Uses `ReActAgent` with native tool calling
- 4 `FunctionTool`s wrapping same business logic
- Built-in conversation history via `chatHistory` parameter
- SSE streaming via `agent.chat({stream: true})`

### 3. Pure SDK Agent (`src/sdk/`) — Manual Loop

```
User Query → LLM Call (with tool schemas) ──→ Has tool_call? ──→ Execute Tool ──→ Add result to messages
                  │                                                    │
                  └────────────────── No ──────────────────────────────┘
                                    │
                                    ▼
                              Final Answer
```

- No agent framework — pure `groq-sdk` / Ollama REST API
- Manual Reason→Act→Observe loop (8-step process)
- JSON Schema tool definitions passed directly to LLM
- Tool executor maps function names to implementations
- Ollama support via JSON prompt-based tool selection (regex-parsed)
- Full iteration tracking, token usage, and latency telemetry

---

## File Structure (Day 14 additions only)

All Day 14 code lives in the existing backend at `H:\Groovy\10th day\backend\src\`:

```
src/
├── agent/                           # LangChain agent
│   ├── createAgent.ts               LangGraph ReactAgent factory
│   ├── executor.ts                  Invoke + stream wrappers
│   ├── memory.ts                    MemorySaver checkpointer
│   ├── logger.ts                    Structured logging
│   └── systemPrompt.ts              Agent system prompt
├── tools/                           # LangChain tools
│   ├── calculatorTool.ts            DynamicStructuredTool (Zod)
│   ├── webSearchTool.ts             DynamicStructuredTool (Zod)
│   ├── slackTool.ts                 DynamicStructuredTool (Zod)
│   └── askMyNotesTool.ts            DynamicStructuredTool (Zod)
├── llama/                           # LlamaIndex agent
│   ├── index.ts                     Public exports
│   ├── config.ts                    LLM & agent config
│   ├── logger.ts                    Structured logging
│   ├── agent.ts                     ReActAgent + runAgent()
│   └── tools/
│       ├── calculator.ts            FunctionTool
│       ├── webSearch.ts             FunctionTool
│       ├── slack.ts                 FunctionTool
│       └── askMyNotes.ts            FunctionTool
├── sdk/                             # Pure SDK agent (no framework)
│   ├── index.ts                     Public exports
│   ├── config.ts                    Agent config from env
│   ├── logger.ts                    Detailed per-step logging
│   ├── types.ts                     TypeScript types
│   ├── llm.ts                       Groq SDK + Ollama REST wrappers
│   ├── schemas.ts                   Tool JSON Schema definitions
│   ├── executor.ts                  Tool call → implementation mapper
│   ├── conversation.ts              Conversation state manager
│   ├── agent.ts                     Manual Reason→Act→Observe loop
│   ├── tools/
│   │   ├── calculator.ts            Pure function (extracted)
│   │   ├── webSearch.ts             Pure function (extracted)
│   │   ├── slack.ts                 Pure function (extracted)
│   │   └── askMyNotes.ts            RAG pipeline wrapper
│   ├── cli/
│   │   └── sdk-cli.ts               Interactive CLI + tests
│   └── controllers/
│       └── sdkController.ts         Express controller
├── cli/
│   ├── agent-cli.ts                 LangChain agent CLI
│   └── llama-cli.ts                 LlamaIndex agent CLI
├── controllers/
│   ├── agentController.ts           LangChain agent controller
│   └── llamaController.ts           LlamaIndex agent controller
├── routes/
│   └── index.ts                     Routes for all 3 agents
├── services/                        (Shared — unchanged)
├── config/                          (Shared — unchanged)
└── ...                              (Everything else — unchanged)
```

---

## How the Pure SDK Agent Works

### The Manual Reason → Act → Observe Loop

```
1. Receive user input
2. Add to conversation history (system + user messages)
3. Send messages + tool schemas to LLM via groq-sdk
4. Parse LLM response:
   - If tool_calls present → extract name + arguments
   - If text response → this is the final answer
5. For each tool call:
   a. Log the tool selection and arguments
   b. Execute via executor.ts (maps name → implementation)
   c. Add tool result back to conversation as a tool message
6. Go back to step 3 (send updated conversation to LLM)
7. Repeat until LLM produces a text response (no tool calls)
8. Return final answer with iteration/token/latency metadata
```

### LLM Integration

- **Groq** (native): Uses `groq-sdk` with OpenAI-compatible `tools` parameter for function calling. The LLM natively returns `tool_calls` in the response.
- **Ollama** (prompt-based): Since Ollama doesn't support native function calling, the system prompt instructs it to respond with `{"tool": "<name>", "args": {...}}` JSON when it wants to use a tool. A regex parser extracts this.

### Key Design Decisions

| Decision | Rationale |
|---|---|
| No framework deps on agent files | `groq-sdk` is the only LLM dependency; no LangChain/LlamaIndex imports |
| Pure functions extracted | Calculator, web search, slack logic extracted from LangChain tool wrappers into standalone async functions |
| RAG pipeline reused | `askMyNotes` calls the same `retrievalService` + `groqService` as the other two agents |
| Conversation state managed | `ConversationManager` class tracks messages, appends tool results, provides full history to LLM |
| Iteration cap | `maxIterations` config (default 10) prevents infinite loops |
| Token tracking | Aggregates across all LLM calls in the loop |
| Ollama fallback | Prompt-based tool selection with JSON parsing (no breaking changes) |

---

## Usage

### Prerequisites

```powershell
cd H:\Groovy\10th day\backend
npm install
```

### Environment (`.env`)

```env
LLM_PROVIDER=ollama           # 'ollama' (local) or 'groq' (cloud)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
GROQ_API_KEY=gsk_...          # Uncomment for cloud mode
```

### Run All Three Agents

```powershell
# ── LangChain Agent ──
npm run agent                 # Interactive CLI
npm run agent:test            # Automated tests

# ── LlamaIndex Agent ──
npm run llama                 # Interactive CLI
npm run llama:test            # Automated tests

# ── Pure SDK Agent (Manual Loop) ──
npm run sdk                   # Interactive CLI
npm run sdk:test              # Automated tests

# ── HTTP Endpoints (server running) ──
curl -X POST http://localhost:3001/agent/ask    -H "Content-Type: application/json" -d "{\"question\": \"What is 15 * 8?\"}"
curl -X POST http://localhost:3001/llama/ask    -H "Content-Type: application/json" -d "{\"question\": \"What is 15 * 8?\"}"
curl -X POST http://localhost:3001/sdk/ask      -H "Content-Type: application/json" -d "{\"question\": \"What is 15 * 8?\"}"
```

### Pure SDK Agent CLI

```
You: What is 984 * 75?

Agent: Let me calculate that.

984 × 75 = 73,800

[1 iterations, 2345ms, 512 tokens]
```

### Pure SDK Agent HTTP Response

```json
{
  "question": "What is 15 + 27?",
  "answer": "15 + 27 = 42",
  "iterations": 1,
  "latencyMs": 1842,
  "tokens": { "input": 425, "output": 32, "total": 457 }
}
```

---

## Multi-Step Workflow Support (All Three Agents)

All three agents support the same multi-tool chains:

| User Request | Tool Chain |
|---|---|
| "What is 984 * 75?" | Calculator |
| "What is the internship deadline in my notes?" | Ask My Notes |
| "Search latest AI news" | Web Search |
| "Calculate 984 * 75 and send it to Slack" | Calculator → Slack |
| "Search AI news and send a summary to Slack" | Web Search → LLM summarizes → Slack |
| "Find the deadline in my notes and notify my team" | Ask My Notes → Extract → Slack |
| "Search AI API pricing, compare with notes, calculate difference, send to Slack" | Web Search → Ask My Notes → Calculator → Slack |

---

## Comparison Summary

| Aspect | LangChain | LlamaIndex | Pure SDK |
|---|---|---|---|
| Lines of agent code | ~200 | ~120 | ~250 |
| External deps | `@langchain/core`, `langchain`, `@langchain/groq`, `@langchain/ollama` | `llamaindex`, `@llamaindex/groq`, `@llamaindex/ollama` | `groq-sdk` only |
| Tool definition | Zod schemas | JSON Schema | JSON Schema |
| Streaming | SSE via event callbacks | Built-in `stream: true` | Manual chunk collect |
| Conversation memory | LangGraph `MemorySaver` | Built-in chatHistory | Custom `ConversationManager` |
| Learning curve | Medium | Low | High (manual loop) |
| Debugging | Opaque (framework magic) | Semi-opaque | Fully transparent |
| Flexibility | Framework-constrained | Framework-constrained | Total control |

---

## Error Handling (All Three Agents)

All agents share identical error handling patterns:
- Invalid tool arguments → descriptive error string
- Calculator: division by zero, missing operands
- Web search: fetch failures, empty results
- Slack: missing webhook URL, API errors
- RAG: ChromaDB connection issues, embedding failures, empty results
- LLM: rate limits (429), network errors, empty responses
- No tool ever crashes the agent — errors are returned as tool results for the LLM to interpret

---

## Dependencies

### LangChain Agent
- `@langchain/core`, `@langchain/groq`, `@langchain/ollama`, `langchain`

### LlamaIndex Agent
- `llamaindex`, `@llamaindex/groq`, `@llamaindex/ollama`

### Pure SDK Agent
- `groq-sdk` (already in project for other services)

### Shared (all three)
- `chromadb`, `@xenova/transformers`, `cohere-ai`, `zod`, `express`, `pdf-parse`

---

## Notes

- The Pure SDK agent has **zero framework dependencies** — only `groq-sdk` for LLM access
- All three agents can be compared directly on the same queries
- The Pure SDK agent demonstrates exactly what happens inside LangChain/LlamaIndex agent loops
- No existing functionality was removed or modified during any of the three implementations
- GitHub: https://github.com/HetSoni916/Groovy
