# Tool Specifications for LLM Function Calling

## What is a Tool Spec?

A tool spec (or function definition) tells an LLM what external functions it can call. The LLM doesn't execute the function — it outputs a JSON argument object, and your app runs it.

## Anatomy of a Tool (OpenAI format)

```json
{
  "type": "function",
  "function": {
    "name": "search_notes",
    "description": "Search the user's notes for relevant information",
    "parameters": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "The search query"
        },
        "max_results": {
          "type": "integer",
          "description": "Maximum number of results",
          "default": 3
        }
      },
      "required": ["query"]
    }
  }
}
```

The `parameters` field is a **JSON Schema** object. This is where JSON Schema design directly feeds into tool specs.

## How It Works

```
User: "What did I learn about microprocessors?"

        │
        ▼
┌─────────────────────────────┐
│  LLM sees tool: search_notes│
│  LLM decides to call it     │
│  Outputs: {"query":          │
│   "microprocessors",         │
│   "max_results": 3}         │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Your app executes           │
│  search_notes("microproces-  │
│  sors", 3)                   │
│  Returns results to LLM      │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  LLM reads results, formats  │
│  answer with citations       │
└─────────────────────────────┘
```

## Multiple Tools Pattern

Tools can chain. Example tools for our RAG app:

| Tool | Description | When Used |
|------|-------------|-----------|
| `search_notes` | Vector search across all notes | Default retrieval |
| `list_documents` | List uploaded documents | "What docs do I have?" |
| `get_document_summary` | Summarize one document | "Summarize my resume" |
| `ask_clarification` | Ask user to narrow down | Ambiguous queries |

## Groq Compatibility

Groq supports OpenAI-compatible tool calling. The format is identical. We define tools in the chat completion request:

```ts
const response = await groq.chat.completions.create({
  model: 'llama-3.3-70b-versatile',
  messages,
  tools: [searchNotesTool, listDocumentsTool],
  tool_choice: 'auto',
});
```

## Tool Spec vs RAG

RAG and function calling serve different purposes:

| Aspect | RAG (current) | Tool Calling |
|--------|--------------|--------------|
| Retrieval method | Vector search → prepend context | LLM decides to call a function |
| Control | Always retrieves | LLM decides if/when to retrieve |
| Latency | Constant (~200ms) | Variable (LLM may skip retrieval) |
| Complexity | Simple pipeline | More complex orchestration |
| Flexibility | Fixed behavior | LLM can choose strategy |

For a Q&A app, the current RAG approach (always retrieve context) is simpler and more reliable. Tool specs shine when the LLM needs to **decide which action to take** among multiple options.
