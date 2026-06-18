# Agent Implementation Comparison

## LangChain · LlamaIndex · Pure SDK

Three parallel agent implementations, same four tools, same underlying services. Built for Day 14 of the Groovy project.

---

## At a Glance

| Metric | LangChain | LlamaIndex | Pure SDK |
|--------|-----------|------------|----------|
| Core code (agent + tools) | 509 lines | **498 lines** | 1,002 lines |
| Framework dependencies | 6 | **4** | **1** (groq-sdk) |
| Agent loop | Implicit (LangGraph) | Implicit (ReActAgent) | **Manual** (explicit) |
| LLM providers | Groq + Ollama | Groq + Ollama | Groq + Ollama |
| Streaming | agent.stream() | agent.chat({stream:true}) | Manual SSE |
| Tool definition | DynamicStructuredTool + Zod | FunctionTool (auto-schema) | Raw JSON Schema |
| State management | MemorySaver (LangGraph) | Manual chatHistory[] | ConversationManager class |
| Ollama tool support | Native (@langchain/ollama) | Native (@llamaindex/ollama) | Prompt-injected JSON + regex |
| Total project files | 9 files | 8 files | 15 files |

---

## Architecture Comparison

### LangChain

User Input -> agent.invoke({messages}) -> LangGraph internal loop:
1. LLM decides: answer OR call_tool
2. DynamicStructuredTool.func() executed
3. ToolMessage appended to state
4. Repeat until final answer / max iterations

checkpointer: MemorySaver (per-thread state)

**Key packages**: langchain, @langchain/core, @langchain/groq, @langchain/ollama, @langchain/community, @langchain/langgraph, zod

### LlamaIndex

User Input -> agent.chat({message, stream, chatHistory}) -> ReActAgent loop:
1. LLM produces Thought/Action/Action Input
2. FunctionTool executed by name
3. Observation appended to prompt
4. Repeat until Final Answer / max iters

Singleton: getAgent() -> cached instance

**Key packages**: llamaindex, @llamaindex/groq, @llamaindex/ollama

### Pure SDK

`
while (iteration < maxIterations) {
    llmCall(messages, toolSchemas)            REASON
    if (tool_calls) {
        executeTool(toolCall)                 ACT
        conversation.addToolResult()          OBSERVE
        continue
    }
    if (content) -> finalAnswer               DONE
}
`

**Key packages**: groq-sdk (only hard dep)

---

## Code Quality & Cleanliness

### LangChain - The Verbose Professional

`
src/agent/
  createAgent.ts     43 lines   LLM factory + createAgent()
  executor.ts       103 lines   invoke() + stream() wrappers
  logger.ts         103 lines   structured logging class
  memory.ts           9 lines   MemorySaver helper
  systemPrompt.ts    30 lines   system prompt constant
src/tools/
  askMyNotesTool.ts  83 lines   RAG pipeline
  calculatorTool.ts  50 lines   math operations
  slackTool.ts       39 lines   Slack webhook
  webSearchTool.ts   49 lines   DuckDuckGo scrape
`

**Strengths:**
- LangGraph createAgent() is production-grade: checkpointing, branching, streaming
- DynamicStructuredTool + Zod gives typed, validated tool inputs
- MemorySaver provides per-thread conversation state

**Weaknesses:**
- Must manually convert between raw history and HumanMessage/AIMessage/ToolMessage objects
- High ceremony - 5 files just for agent setup
- 6 framework dependencies pulls in hundreds of transitive packages

### LlamaIndex - The Minimalist

`
src/llama/
  agent.ts          124 lines   ReActAgent setup + runAgent()
  config.ts          13 lines   env-based config
  index.ts            6 lines   barrel exports
  logger.ts          95 lines   structured logging
  tools/
    askMyNotes.ts    90 lines   RAG pipeline
    calculator.ts    63 lines   math operations
    slack.ts         49 lines   Slack webhook
    webSearch.ts     58 lines   DuckDuckGo scrape
`

**Strengths:**
- Smallest footprint: 498 lines, 8 files
- FunctionTool auto-generates JSON Schema from the function wrapper - no Zod needed
- ReActAgent needs zero configuration for the loop
- Streaming is a single parameter: { stream: true }
- getAgent() singleton pattern is elegant

**Weaknesses:**
- No built-in state persistence (must manage chatHistory[] externally)
- Less control over the internal loop
- Smaller ecosystem than LangChain

### Pure SDK - The Transparent

`
src/sdk/
  agent.ts             132 lines   main Reason->Act->Observe loop
  llm.ts               170 lines   dual-provider LLM abstraction
  executor.ts           49 lines   tool dispatch (switch)
  conversation.ts       59 lines   message state manager
  types.ts              65 lines   all type definitions
  schemas.ts            82 lines   tool JSON Schemas
  config.ts             14 lines   env-based config
  index.ts               7 lines   barrel exports
  logger.ts             90 lines   structured logging
  controllers/
    sdkController.ts    49 lines   Express HTTP handler
  cli/
    sdk-cli.ts         118 lines   interactive CLI + test runner
  tools/
    calculator.ts       40 lines   math operations
    webSearch.ts        40 lines   DuckDuckGo scrape
    slack.ts            28 lines   Slack webhook
    askMyNotes.ts       59 lines   RAG pipeline
`

**Strengths:**
- Zero framework magic - every step is explicit and visible
- Single hard dependency: groq-sdk
- Ollama fallback uses prompt-injected JSON parsing (no extra deps)
- Full type system with AgentRunResult, TokenUsage, AgentIteration
- Complete control over loop behavior, error handling, token tracking

**Weaknesses:**
- 2x the code (1,002 lines vs ~500 for frameworks)
- Ollama provider needs regex-based tool parsing (fragile)
- Must write and maintain own conversation manager, type system, schema defs

---

## Performance Analysis

All three implementations spend >99% of execution time waiting for the LLM to respond. Framework overhead is negligible (~1-5ms per iteration vs 1-5s of LLM latency).

| Metric | LangChain | LlamaIndex | Pure SDK |
|--------|-----------|------------|----------|
| Per-iteration overhead | ~3-5ms | ~2-3ms | **~1ms** |
| LLM call overhead | LangGraph state mgmt | ReActAgent internals | Direct API call |
| Streaming overhead | Chunk processing | AsyncIterable | Manual SSE events |
| Memory overhead | Graph state + checkpointer | Agent object | Simple array |

**The real performance differentiator is LLM provider, not framework:**
- Groq llama-3.3-70b-versatile: ~2-5s per call, smarter
- Ollama llama3.2:3b (local): ~0.5-2s per call, dumber

**Winner**: Pure SDK (by ~2-4ms per iteration - academic)

---

## Dependency Footprint

| Package | LangChain | LlamaIndex | Pure SDK |
|---------|-----------|------------|----------|
| langchain | Required | - | - |
| @langchain/core | Required | - | - |
| @langchain/community | Required | - | - |
| @langchain/groq | Required | - | - |
| @langchain/ollama | Required | - | - |
| @langchain/langgraph | Required | - | - |
| llamaindex | - | Required | - |
| @llamaindex/groq | - | Required | - |
| @llamaindex/ollama | - | Required | - |
| groq-sdk | Transitive | Transitive | **Required** |
| zod | Required | - | - |
| Transitive packages | ~500+ | ~200+ | **~50** |

**Winner**: Pure SDK (1 direct dep vs 6 vs 4)

---

## Feature Matrix

| Feature | LangChain | LlamaIndex | Pure SDK |
|---------|-----------|------------|----------|
| Calculator tool | Yes | Yes | Yes |
| Web search (DuckDuckGo) | Yes | Yes | Yes |
| Slack webhook | Yes | Yes | Yes |
| Ask My Notes (RAG) | Yes | Yes | Yes |
| Streaming responses | Yes (agent.stream) | Yes (agent.chat stream) | Yes (manual SSE) |
| Multi-provider LLM | Groq + Ollama | Groq + Ollama | Groq + Ollama |
| Conversation history | MemorySaver | chatHistory param | ConversationManager |
| Tool validation | Zod schemas | Auto from FunctionTool | Manual JSON Schema |
| Token usage tracking | Manual | Manual | Built-in (TokenUsage) |
| Latency tracking | Manual | Manual | Built-in (AgentRunResult) |
| Error isolation per tool | Yes | Yes | Yes |
| Thread-safe state | Yes (thread_id) | No (singleton) | No (per-call fresh) |
| Ollama function calling | Native SDK support | Native SDK support | Regex prompt injection |
| Express controller | Yes | Yes | Yes |
| CLI interface | Yes (agent-cli) | Yes (llama-cli) | Yes (sdk-cli) |

---

## Verdict

### Winner by Category

**Cleanest code**: **LlamaIndex** - 498 lines, 8 files, 4 deps. Minimalist API with FunctionTool auto-schemas and ReActAgent simplicity. Gets out of your way.

**Fastest execution**: **Pure SDK** - ~1ms overhead vs ~3-5ms. Negligible difference in practice (>99% of time is LLM latency), but technically the leanest.

**Best dependencies**: **Pure SDK** - 1 hard dep (groq-sdk) vs 4-6 for frameworks. No transitive bloat.

**Most production-ready**: **LangChain** - LangGraph checkpointing, thread-safe state management, streaming middleware, and extensive ecosystem support.

**Best Ollama support**: **LangChain / LlamaIndex** - Native Ollama function calling via dedicated SDKs. Pure SDK has to hack it with regex pattern matching on raw JSON in the prompt.

**Most transparent / educational**: **Pure SDK** - Writing the Reason-Act-Observe loop by hand makes it impossible to not understand how agents work.

### Final Recommendations

| If you want... | Pick... |
|----------------|---------|
| Minimal code, quick prototyping | **LlamaIndex** |
| Production deployment with state mgmt | **LangChain** |
| Zero dependencies, full control | **Pure SDK** |
| To learn how agents work | **Pure SDK** |
| Local Ollama with function calling | **LangChain** or **LlamaIndex** |

### The Bottom Line

The frameworks save ~500 lines of code but add ~5-10s of npm install time and hundreds of transitive dependencies. For a simple 4-tool ReAct agent, the Pure SDK proves you don't need a framework. But as soon as you want checkpointing, branching, streaming middleware, or Ollama function calling, the frameworks pay for themselves.

**LlamaIndex hits the sweet spot**: most elegance per line of code. **Pure SDK is the lean machine**. **LangChain is the workhorse**.