# Day 14: LangChain Agentic AI Assistant

## Context

Day 12 had an advanced RAG-based "Ask My Notes" document assistant with PDF upload and parsing, multiple chunking strategies including fixed-size, semantic, sliding-window, and hierarchical chunking, embedding generation using OpenAI or Voyage models, ChromaDB vector database for storing embeddings, vector similarity retrieval, Cohere reranking for second-pass retrieval, LLM-generated answers with source page citations, and cost and token telemetry. Day 13 had a manual multi-tool AI agent using Groq LLM with a manual tool-calling loop, JSON schema based tool definitions, a calculator tool supporting addition, subtraction, multiplication, and division, a web search tool using Tavily API or DuckDuckGo, a Slack webhook tool for sending messages, and manual logic for deciding which tool to execute.

## Objective

The goal was to convert the existing Day 12 and Day 13 systems into a single LangChain-powered Agentic AI Assistant without removing any existing functionality, by reusing the current implementations and refactoring them into LangChain tools. The manual Groq tool loop was replaced with LangChain's AgentExecutor, allowing the agent to understand user requests, decide which tools are needed, execute one or multiple tools in sequence, observe tool results, continue reasoning until the final answer is ready, maintain conversation history, and support streaming responses.

## Architecture

The final architecture follows: User Query goes into the LangChain AgentExecutor which routes to Calculator Tool, Web Search Tool, Slack Tool, or Ask My Notes Tool. The Ask My Notes Tool connects to the existing RAG Pipeline which uses ChromaDB, Cohere Reranker, and LLM Answer generation with source page citations.

Four LangChain tools were created by wrapping the existing logic. The Calculator Tool reuses the existing calculator implementation supporting add, subtract, multiply, and divide operations while handling invalid operations and division by zero gracefully. The Web Search Tool reuses the existing DuckDuckGo search implementation where the agent decides when real-time information is required and search results are summarized before presenting to the user. The Slack Tool reuses the existing Slack webhook implementation allowing the agent to send messages or summaries to Slack. The Ask My Notes Tool (RAG Tool) was created as a LangChain tool by wrapping the existing Day 12 RAG pipeline, accepting a natural language question, generating query embeddings, performing vector similarity search in ChromaDB, retrieving relevant document chunks, applying Cohere reranking, and generating a final RAG answer with proper page citations.

The LangChain agent supports executing multiple tools in a single user request. For example, searching today's AI news and sending a summary to Slack chains the Web Search Tool through summarization to the Slack Tool. Finding the project deadline in notes and notifying the team on Slack chains the Ask My Notes Tool through deadline extraction to the Slack Tool. Finding the latest AI API pricing, comparing it with information in notes, calculating the difference, and sending the report to Slack chains the Web Search Tool through the Ask My Notes Tool through the Calculator Tool to the Slack Tool.

The implementation uses LangChain's AgentExecutor for managing the agent loop, the LangChain Tool abstraction, a proper system prompt defining agent behavior, conversation memory via LangGraph checkpointer, streaming responses, and intermediate execution logging. The agent loop follows the pattern of Thought, Choose Tool, Execute Tool, Observe Result, Decide Next Action, and Final Answer.

## Project Structure

```
src/
├── agent/
│   ├── createAgent.ts       LangChain ReactAgent creation with ChatGroq
│   ├── executor.ts          AgentExecutor wrapper with invoke and stream modes
│   ├── memory.ts            LangGraph MemorySaver checkpointer for persistence
│   ├── logger.ts            Detailed structured logging for all operations
│   └── systemPrompt.ts      System prompt defining agent behavior
├── tools/
│   ├── calculatorTool.ts    Calculator tool wrapping existing math logic
│   ├── webSearchTool.ts     Web search tool wrapping DuckDuckGo
│   ├── slackTool.ts         Slack tool wrapping webhook integration
│   └── askMyNotesTool.ts    RAG tool wrapping ChromaDB + reranker + Groq
├── services/
│   ├── agent.service.ts     Refactored to use LangChain AgentExecutor
│   ├── anthropic.service.ts Existing Groq LLM service (unchanged)
│   ├── chunker.ts           Existing chunking strategies (unchanged)
│   ├── embedding.service.ts Existing embedding generation (unchanged)
│   ├── pdfParser.ts         Existing PDF parser (unchanged)
│   ├── reranker.service.ts  Existing Cohere reranker (unchanged)
│   ├── retrieval.ts         Existing retrieval pipeline (unchanged)
│   └── vectorStore.ts       Existing ChromaDB client (unchanged)
├── controllers/
│   ├── agentController.ts   Updated with LangChain + SSE streaming
│   ├── chatController.ts    Existing chat controller (unchanged)
│   └── pdfController.ts     Existing PDF controller (unchanged)
├── cli/
│   └── agent-cli.ts         Updated CLI with LangChain + multi-step tests
├── config/
│   └── index.ts             Existing config (unchanged)
├── middleware/
│   ├── errorHandler.ts      Existing error handler (unchanged)
│   ├── upload.ts            Existing upload middleware (unchanged)
│   └── validate.ts          Existing validation middleware (unchanged)
├── routes/
│   └── index.ts             Updated with LangChain agent route
├── schemas/
│   └── index.ts             Existing Zod schemas (unchanged)
├── types/
│   └── index.ts             Existing type definitions (unchanged)
├── utils/
│   ├── pricing.ts           Existing pricing utils (unchanged)
│   ├── storage.ts           Existing storage utils (unchanged)
│   └── tokenizer.ts         Existing tokenizer (unchanged)
├── app.ts                   Existing Express app (unchanged)
└── server.ts                Existing server entry (unchanged)
```

## Environment Variables

Required in `.env`:
```
GROQ_API_KEY=your_groq_api_key
PORT=3001
MAX_FILE_SIZE_MB=50
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
# Optional: COHERE_API_KEY with USE_RERANKER=true for second-pass retrieval
# Optional: SLACK_WEBHOOK_URL for Slack tool
```

## Usage

```powershell
# Start ChromaDB (required for Ask My Notes tool)
chroma.exe run --path "storage\chroma" --port 8000

# Start the server
npm run dev

# Interactive agent CLI
npm run agent

# Automated tests
npm run agent:test

# API endpoint
curl -X POST http://localhost:3001/api/agent/ask -H "Content-Type: application/json" -d '{"question": "What is 15 * 8?"}'

# Streaming API
curl -X POST http://localhost:3001/api/agent/ask -H "Content-Type: application/json" -d '{"question": "Search AI news", "stream": true}'
```

## Test Cases

Test Case 1: User asks "Calculate 984 × 75" — only calculator tool executes.
Test Case 2: User asks "What is the internship deadline in my notes?" — only Ask My Notes tool executes with page citations.
Test Case 3: User asks "Find today's AI news and send a summary to Slack" — Web Search Tool followed by Slack Tool.
Test Case 4: User asks "Find current AI API pricing, compare it with my stored notes, calculate the price difference, and send a report to Slack" — Web Search Tool through Ask My Notes Tool through Calculator Tool through Slack Tool.

## Error Handling

All tools have proper error handling for missing API keys, invalid tool inputs, calculator errors including division by zero, search API failures, Slack webhook failures, ChromaDB connection issues, embedding failures, and LLM failures. The agent never crashes because a tool fails — it returns meaningful error messages and continues gracefully when possible.
