# Day 14: LlamaIndex Agentic AI Assistant

## Task Prompt

> Build the existing AI agent using LlamaIndex instead of LangChain. Create a LlamaIndex-based agent that can use multiple tools, perform reasoning, and execute the correct tools based on the user's request.
>
> **Requirements:**
>
> - Use the latest LlamaIndex Agent framework and Query Engine.
> - Implement the existing tools as LlamaIndex FunctionTools:
>   - Calculator Tool (add, subtract, multiply, divide)
>   - Web Search Tool (Tavily or DuckDuckGo)
>   - Slack Webhook Tool (send messages/notifications)
>   - Ask My Notes Tool using LlamaIndex Query Engine connected to ChromaDB for RAG-based document retrieval
>
> The agent should:
> - Analyze the user query.
> - Select the appropriate tool automatically.
> - Execute one or multiple tools in sequence.
> - Maintain conversation context.
> - Support streaming responses.
> - Return a final well-formatted answer.
>
> For the Ask My Notes Query Engine:
> - Connect to the existing ChromaDB vector store.
> - Retrieve relevant document chunks.
> - Use existing embeddings.
> - Apply reranking if available.
> - Generate answers with source page citations.
>
> Support multi-step workflows, for example:
> - "Search today's AI news and send a summary to Slack."
> - "Find the deadline in my notes and notify my team."
> - "Compare information from the web with my notes, calculate differences, and send the report."
>
> Use a clean modular architecture with separate folders for:
> - agent configuration
> - query engine
> - tools
> - configuration/environment variables
>
> Add proper error handling, logging, and environment variable management. Reuse existing business logic wherever possible and avoid rewriting working implementations.
>
> The final result should be a production-quality LlamaIndex Agent that demonstrates automatic tool selection, RAG query capabilities, and multi-tool reasoning.

## Architecture

The LlamaIndex agent uses `ReActAgent` (React agent pattern) with four `FunctionTool` wrappers. It runs alongside the existing LangChain agent — both share the same underlying services (ChromaDB, embeddings, retrieval, Groq/Ollama LLM).

```
User Query
     │
     ▼
┌─────────────────┐
│  ReActAgent     │  (llamaindex)
│  - analyzes     │
│  - selects tool │
│  - executes     │
│  - observes     │
│  - loops        │
└────────┬────────┘
         │
    ┌────┼────┬───────────┬──────────────┐
    ▼    ▼    ▼           ▼              ▼
 ┌────┐ ┌────┐ ┌──────┐ ┌────────┐ ┌──────────┐
 │Calc│ │Web │ │Slack │ │Ask My │ │Reuses    │
 │Tool│ │Srch│ │Tool  │ │Notes  │ │existing  │
 │    │ │Tool│ │      │ │Tool   │ │services  │
 └────┘ └────┘ └──────┘ │(RAG)  │ │(retrieval│
                         └───┬────┘ │, groq,   │
                             ▼      │embedding)│
                     ┌───────────┐  └──────────┘
                     │ ChromaDB  │
                     │ +Reranker │
                     │ +LLM Gen  │
                     └───────────┘
```

## Key Differences from LangChain Agent

| Aspect | LangChain Agent | LlamaIndex Agent |
|---|---|---|
| Framework | `@langchain/core`, `langchain` | `llamaindex` |
| Agent type | `createReactAgent` (LangGraph) | `ReActAgent` |
| Tool type | `DynamicStructuredTool` (Zod) | `FunctionTool` (JSON Schema) |
| Tool creation | `new DynamicStructuredTool({...})` | `new FunctionTool(fn, {name, description, parameters})` |
| Conversation memory | `MemorySaver` checkpointer | Built-in via `chatHistory` parameter |
| LLM providers | `@langchain/groq`, `@langchain/ollama` | `@llamaindex/groq`, `@llamaindex/ollama` |
| LLM switch | Via env var in code | Via `Groq`/`Ollama` class in code |

## Project Structure

```
src/
├── llama/                          # LlamaIndex agent (new — this task)
│   ├── index.ts                    Public exports
│   ├── config.ts                   LLM & agent configuration from env
│   ├── logger.ts                   Structured per-step logging
│   ├── agent.ts                    ReActAgent creation + runAgent() + resetAgent()
│   └── tools/
│       ├── calculator.ts           FunctionTool wrapping existing calc logic
│       ├── webSearch.ts            FunctionTool wrapping DuckDuckGo search
│       ├── slack.ts                FunctionTool wrapping Slack webhook
│       └── askMyNotes.ts           FunctionTool wrapping RAG pipeline
├── cli/
│   └── llama-cli.ts                Interactive CLI + automated test runner
├── controllers/
│   └── llamaController.ts          Express controller (JSON + SSE streaming)
├── routes/
│   └── index.ts                    POST /llama/ask route
├── tools/                          (LangChain tools — unchanged, shared logic)
├── agent/                          (LangChain agent — unchanged)
├── services/                       (Shared services — unchanged)
└── ...                             (Everything else — unchanged)
```

## How It Works

### Agent Loop (ReActAgent)

1. User sends a query
2. `ReActAgent` analyzes the query and decides which tool to use
3. Agent formats a tool call with arguments derived from the query
4. The `FunctionTool.call()` method validates arguments and executes the wrapped function
5. Result is returned to the agent
6. Agent observes the result and either:
   - Calls another tool (for multi-step tasks)
   - Synthesizes a final answer
7. Final answer is returned to the user

### Tool Implementations

Each `FunctionTool` wraps the exact same business logic as its LangChain counterpart:
- **Calculator** (`calculatorTool.ts`): Imports nothing external — pure `calculate()` function with 7 operations
- **Web Search** (`webSearchTool.ts`): Same DuckDuckGo HTML scrape as the LangChain version
- **Slack** (`slackTool.ts`): Same `sendSlackMessage()` with webhook URL from env or parameter
- **Ask My Notes** (`askMyNotesTool.ts`): Reuses `retrievalService.search()` → `retrievalService.buildContext()` → `groqService.generateResponse()` — the same RAG pipeline from Day 12, with inline citations and source list

### LLM Provider Switching

Controlled by `LLM_PROVIDER` env variable in `.env`:
- `groq` — uses `@llamaindex/groq` `Groq` class → calls Groq cloud API
- `ollama` (default) — uses `@llamaindex/ollama` `Ollama` class → calls local Ollama server

### Streaming

When `stream=true` is passed to `runAgent()`, the agent calls `agent.chat({stream: true})` and collects chunks into a single string before returning.

## Usage

### Prerequisites

```powershell
# Install dependencies (already done)
cd H:\Groovy\10th day\backend
npm install
```

### Environment Variables

```env
# In .env — shared with LangChain agent
LLM_PROVIDER=ollama           # 'ollama' (local) or 'groq' (cloud)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
# GROQ_API_KEY=your_key_here  # Uncomment for cloud mode
```

### Run the Agent

```powershell
# Interactive CLI
npm run llama

# Automated tests
npm run llama:test

# HTTP endpoint (with server running)
curl -X POST http://localhost:3001/llama/ask ^
  -H "Content-Type: application/json" ^
  -d "{\"question\": \"What is 15 * 8?\"}"

# Streaming endpoint
curl -X POST http://localhost:3001/llama/ask ^
  -H "Content-Type: application/json" ^
  -d "{\"question\": \"Search AI news\", \"stream\": true}"
```

### CLI Commands

Inside the interactive CLI:
- Type any question to ask the agent
- `test` — run the automated test suite
- `reset` — reset the agent instance (clear state)
- `exit` — quit

## Multi-Step Workflow Examples

| Query | Tool Chain |
|---|---|
| "What is 984 * 75?" | Calculator only |
| "What is the internship deadline in my notes?" | Ask My Notes only |
| "Search latest AI news" | Web Search only |
| "Calculate 984 * 75 and send it to Slack" | Calculator → Slack |
| "Find the deadline in my notes and send a reminder to Slack" | Ask My Notes → Slack |
| "Search AI API pricing, compare with my notes, calculate the difference, and send to Slack" | Web Search → Ask My Notes → Calculator → Slack |

## Test Cases

The automated test suite (`npm run llama:test`) runs:

1. **Calculator tests** (5 tests): 15+27, 100/4, 7^3, sqrt(144), 17 mod 5
2. **Web search test**: queries about CEO of Tesla and latest Python version
3. **Slack test**: sends a test message (skipped if no `SLACK_WEBHOOK_URL`)
4. **Ask My Notes test**: queries "What is the internship deadline in my notes?"
5. **Multi-step test**: "Calculate 984 * 75, then send the result to Slack"

## Error Handling

- **Rate limits**: Groq 429 errors bubble up with timing info
- **Missing API keys**: Clear error messages for Groq, Slack, Cohere
- **Tool errors**: Each tool returns descriptive error strings (never crashes)
- **LLM failures**: Agent catches and surfaces LLM errors gracefully
- **Streaming failures**: SSE error events sent to client

## Dependencies Added

- `llamaindex@^0.12.1` — Core LlamaIndex TS framework
- `@llamaindex/groq@^0.0.94` — Groq LLM adapter
- `@llamaindex/ollama@^0.1.23` — Ollama LLM adapter

## Notes

- LlamaIndex.TS was [deprecated on Apr 30, 2026](https://github.com/run-llama/LlamaIndexTS) but the npm package (`llamaindex@0.12.1`) is fully functional
- The adapter packages (`@llamaindex/groq`, `@llamaindex/ollama`) are also marked deprecated but work with the current version
- No existing functionality was removed or modified — the LlamaIndex agent is a parallel implementation alongside the LangChain agent
- Both agents share the same `services/`, `config/`, and ChromaDB backend
