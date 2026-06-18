# Week 2 Retrospective (Days 6–10)

## What Worked

### Day 6 — API Integration & Week 1 Retro
- Successfully built both a CLI chatbot and HTTP server chatbot supporting **5 providers** (Groq, OpenAI, Gemini, Cohere, Local)
- Created multi-language API clients in Python and Node.js for Groq
- Solidified understanding of environment variable management for API keys

### Day 7 — Model Benchmarking & Provider Comparison
- Automated **50-prompt benchmark** with latency stats (avg, min, max, P50, P95)
- Produced a decision matrix comparing Claude 3.5 Haiku, GPT-4o-mini, and Gemini 2.0 Flash across cost, context, multimodal, speed, and quality
- Added **exponential backoff retry logic** with graceful handling of HTTP 429 rate limits
- Integrated Gemini API with correct Generative Language API format

### Day 8 — Streaming & Token Tracking
- Upgraded chatbot to **streaming responses** — tokens appear in real-time
- Added per-message token tracking (word-count approximation) and session cost calculation
- Implemented `/cost` and `/usage` interactive CLI commands
- Added **jitter to exponential backoff** for more robust retry behavior

### Day 9 — API Logging & Dashboard
- Built `tracker.py` for CSV-based logging of every API call (timestamp, provider, model, tokens, cost, latency, prompt/response previews)
- Created `dashboard.py` — terminal dashboard showing per-provider stats, grand totals, and recent 10 calls
- Established a clean **modular separation** between chatbot, logging, and reporting concerns

### Day 10 — CodeBase Explainer
- Built a full-stack TypeScript application (Express + React + Vite + Tailwind)
- **Codebase scanning** — detected tech stacks (React, Express, Flask, TypeScript, etc.), entry points, API routes, and folder structure trees
- **Smart code chunking** — split files at function/class boundaries with sub-chunking for large regions
- **RAG pipeline** — vector search over code chunks + context window building + multi-provider AI answers
- **Beginner/Advanced explanation modes** with source references and cost telemetry
- Abstracted `AIProvider` interface for clean provider swapping (Groq, Gemini, Cohere)
- Added per-IP rate limiting middleware

### 10th Day — Ask My Notes (PDF Q&A)
- Built another full-stack app for **PDF document Q&A** with source citations
- **PDF parsing** — extracted text page-by-page using `pdf-parse` with form-feed boundaries
- **Clever TF-IDF retrieval** — no vector DB needed; used term frequency scoring with exact-phrase bonus and title proximity bonus
- **Context window management** — token budgets split across system prompt, context docs, and question
- **Cost telemetry** — displayed model, tokens, cost, and latency per query in the UI
- Multi-document search with checkbox selection and chat history persistence

## What Was Hard

### API Integration (Day 6–7)
- Getting **consistent request/response formats** across 5 very different providers
- Debugging Gemini's unique API endpoint and system instruction format

### Rate Limiting & Reliability (Day 7–8)
- Handling **provider-specific error codes** (especially 429s) gracefully
- Tuning exponential backoff parameters — too aggressive wasted time, too aggressive caused cascading failures
- SSE stream parsing differences between Groq, Gemini, and Cohere required per-provider streaming generators

### Code Chunking (Day 10)
- **Function/class boundary detection** across multiple languages (JS/TS, Python, Java, C++) with different syntax rules
- Handling **nested structures** (e.g., classes inside functions, closures)
- Merging small adjacent chunks back together while respecting the 100-line limit

### Retrieval Quality (10th Day)
- TF-IDF without a vector DB required **careful tuning** of stop words, phrase bonuses, and proximity heuristics
- Context window budgeting — fitting enough relevant chunks while staying under model token limits
- Balancing **recall vs. precision** — too narrow missed context, too wide wasted tokens

### Full-Stack Overlap (Day 10 + 10th Day)
- Building **two parallel full-stack projects** in one day meant context switching between similar but distinct architectures
- CodeBase Explainer (vector RAG + PostgreSQL) vs Ask My Notes (TF-IDF RAG + JSON storage) — different DB, different retrieval, different chunking

### General
- Managing **5+ API keys** across `.env` files and keeping them straight
- Python's `urllib` vs `requests` library differences during the Day 8 upgrade
- CSV log file contention — ensuring `tracker.py` handles concurrent writes safely

## Key Takeaways

| Area | Lesson Learned |
|------|---------------|
| **Provider abstraction** | A common interface (`AIProvider`) makes swapping providers trivial |
| **Retry strategy** | Exponential backoff + jitter is essential for production API clients |
| **Streaming** | SSE parsing must be customized per provider — there's no universal format |
| **RAG without vector DB** | TF-IDF + smart heuristics works well for document Q&A at small scale |
| **Code chunking** | Language-aware boundary detection beats naive line-count splitting every time |
| **Modularity** | Separating concerns (chatbot / logging / dashboard / retrieval) made each piece testable and reusable |
| **Cost visibility** | Displaying per-query token and cost data builds user trust and enables optimization |
