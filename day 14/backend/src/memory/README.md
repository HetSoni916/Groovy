# Agent Memory System (Short-Term + Long-Term)

This module implements a dedicated agent memory system, supporting both short-term (session-specific chat context) and long-term (persistent semantic fact extraction and preference storage) memories.

It is integrated across all three agent architectures (Pure SDK, LangChain, and LlamaIndex) in the backend.

---

## Task Requirements & Original Prompt

```text
Implement agent memory · short-term + long-term
Upgrade existing agent by adding the ability to remember information across a conversation and across sessions.

Requirements:
1. Short-Term Memory (Conversation Memory)
   - Maintain context during the current conversation session.
   - Remember user messages, assistant responses, tool calls, and outputs.
   - Automatically append: User messages, Assistant responses, Tool requests, Tool results.
   - Limit memory window (last N messages, truncation, or summarization).

2. Long-Term Memory (Persistent Memory)
   - Survive application restarts.
   - Store user preferences, important facts, and recurring details (e.g. names, Slack channels).
   - Support storing, retrieving, updating, and deleting memories.
   - Use semantic similarity (vector store/ChromaDB or JSON file fallback) for search.

3. Integration Requirements
   - Works across Calculator, Web Search, Slack, and Ask My Notes RAG tools.
   - Available during tool selection, reasoning, and final answer generation.
   - Support multiple users and separate memory by user/session ID.
```

---

## Memory Architecture

```
                 Memory Manager
                       |
                       |
         -----------------------------
         |                           |
     Short-Term                  Long-Term
       Memory                     Memory
     (Session)                 (Persistent)
         |                           |
    Chat History          Database / Vector Store
 (sessions_memory.json)   (ChromaDB / JSON Fallback)
```

1. **Short-Term Memory Module** (`src/memory/shortTermMemory.ts`)
   - Stores user/assistant chat history by `sessionId`.
   - Limits active context length to a sliding window of the last 20 messages.
   - Saves records to `storage/sessions_memory.json`.

2. **Long-Term Memory Module** (`src/memory/longTermMemory.ts`)
   - Automatically extracts important user details, choices, and rules from dialogues.
   - Indexes text snippets in ChromaDB under collection `long-term-memory`.
   - Performs semantic searches against query inputs to retrieve relevant context.
   - Includes automatic local JSON file fallback (`storage/long_term_memories.json`) with keyword lookup in case ChromaDB is offline.

3. **Memory Manager** (`src/memory/memoryManager.ts`)
   - Retrieves semantic facts corresponding to user queries and appends them to the base system prompt dynamically under a `## User Profile & Stored Memories` block.
   - Handles background asynchronous LLM calls to extract structural persistent preferences upon dialog turn completion.

---

## Setup & Running Verification

### Run Automated Unit Tests:
Run the memory verification script to test isolated short-term additions, long-term semantic retrieval, and system prompt context injection:
```powershell
npx ts-node src/memory/test-memory.ts
```

### Run CLIs with Memory:
Open interactive CLIs to test memory persistence across restarts:
```powershell
# Pure SDK
npm run sdk

# LangChain
npm run agent

# LlamaIndex
npm run llama
```

### Try These Steps:
1. Start the CLI (`npm run sdk`) and say: `"I prefer python, and send reports to engineering channel on Slack."`
2. Ask: `"What channel should I send reports to?"` (Checks short-term memory).
3. Exit (`exit`) and restart the CLI (`npm run sdk`).
4. Ask: `"Summarize python news and send them to my team channel."` (Checks long-term memory retrieval injects preferences into system instructions).
