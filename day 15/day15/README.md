# Groovy AI Meeting Summary Agent

> **A production-ready internal tool that transforms meeting transcripts into structured, actionable intelligence — automatically stored, retrievable, and shareable.**

---

## The Problem

At Groovy, engineering teams spend hours in meetings every day, but critical information gets lost:
- Action items are forgotten or buried in chat threads
- Decisions lack clear documentation
- Team members miss deadlines because ownership is unclear
- New hires have no way to catch up on past discussions
- Managers waste time manually compiling meeting notes

## The Solution

The AI Meeting Summary Agent solves this by:

1. **Understanding** meeting transcripts using LLM-powered analysis
2. **Extracting** structured summaries, decisions, action items, deadlines, and blockers
3. **Storing** everything in a queryable database
4. **Notifying** teams via Slack with formatted summaries
5. **Retrieving** past meetings on demand — "What decisions were made in the API architecture meeting?"

---

## System Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│              │     │                  │     │                 │
│   User CLI   │────▶│  Meeting Agent   │────▶│   LLM Client    │
│   (stdin)    │     │  (Orchestrator)  │     │  (OpenAI/Groq)  │
│              │     │                  │     │                 │
└──────────────┘     └────────┬─────────┘     └─────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │                    │
                    ▼                    ▼
             ┌──────────────┐    ┌──────────────┐
             │              │    │              │
             │  SQLite DB   │    │   Slack      │
             │  (Storage)   │    │   Webhook    │
             │              │    │              │
             └──────────────┘    └──────────────┘
```

### Project Structure

```
src/
├── agent/
│   ├── meetingAgent.js    # Core orchestration logic
│   └── prompts.js         # LLM system prompts
├── llm/
│   └── client.js          # OpenAI-compatible LLM wrapper
├── tools/
│   ├── databaseTool.js    # CRUD operations for meetings
│   └── slackTool.js       # Slack webhook notifications
├── database/
│   ├── connection.js      # SQLite connection & schema
│   └── meetingModel.js    # (Data shape — see schema)
├── config/
│   └── env.js             # Environment variable loader
├── logger.js              # Structured logging with colors
└── app.js                 # CLI entry point
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ (ES Modules) |
| LLM | OpenAI GPT-4o-mini / Groq Llama 3 / Anthropic Claude 3 |
| Database | SQLite via `better-sqlite3` |
| Slack | Incoming Webhooks |
| Logging | Custom structured logger with cost tracking |

---

## Setup Instructions

### Prerequisites

- Node.js 18 or later
- An API key from OpenAI, Groq, or Anthropic
- A Slack workspace with webhook permissions (optional)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd meeting-summary-agent

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes* | OpenAI API key |
| `LLM_PROVIDER` | No | `openai` (default), `groq`, or `anthropic` |
| `OPENAI_MODEL` | No | Model name (default: `gpt-4o-mini`) |
| `GROQ_API_KEY` | Yes* | Groq API key (if using Groq) |
| `GROQ_MODEL` | No | Model name (default: `llama-3.3-70b-versatile`) |
| `ANTHROPIC_API_KEY` | Yes* | Anthropic API key (if using Anthropic) |
| `DATABASE_PATH` | No | Path to SQLite DB (default: `./data/meetings.db`) |
| `SLACK_WEBHOOK_URL` | No | Slack incoming webhook URL |
| `LOG_LEVEL` | No | `DEBUG`, `INFO` (default), `WARN`, `ERROR` |

*\*At least one LLM API key is required.*

---

## Database Schema

```sql
CREATE TABLE meetings (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  date            TEXT NOT NULL,
  participants    TEXT NOT NULL DEFAULT '[]',       -- JSON array
  transcript      TEXT NOT NULL,
  summary         TEXT NOT NULL,
  key_points      TEXT NOT NULL DEFAULT '[]',       -- JSON array
  decisions       TEXT NOT NULL DEFAULT '[]',       -- JSON array
  action_items    TEXT NOT NULL DEFAULT '[]',       -- JSON array of objects
  risks_blockers  TEXT NOT NULL DEFAULT '[]',       -- JSON array
  status          TEXT NOT NULL DEFAULT 'completed',
  token_usage     TEXT,                              -- JSON object
  cost_estimate   REAL DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Action Items JSON Structure

```json
[
  {
    "task": "Implement rate limiting middleware",
    "owner": "Marcus Johnson",
    "deadline": "Friday"
  }
]
```

---

## Usage

### Start the Agent

```bash
npm start
```

### Commands

| Command | Description |
|---------|-------------|
| `process <title>` | Analyze a sample transcript and save results |
| `summary <query>` | Retrieve a meeting by ID or keyword |
| `actions <query>` | Get action items (use "recent", "yesterday", etc.) |
| `decisions <query>` | Get decisions from past meetings |
| `slack <id>` | Send full meeting summary to Slack |
| `slack-actions <q>` | Send action items to Slack |
| `list [n]` | Show last N meetings (default: 10) |
| `help` | Show command reference |

---

## Example Prompts & Workflows

### Test 1: Process a transcript

```
groovy-agent> process Engineering Standup June 19
```

**Expected:** LLM analyzes the transcript → structured summary generated → saved to database.

### Test 2: Retrieve action items

```
groovy-agent> actions yesterday
```

**Expected:** Database queried → action items displayed with owners and deadlines.

### Test 3: Query historical decisions

```
groovy-agent> decisions API architecture
```

**Expected:** Database searched → matching decisions returned.

### Test 4: Send to Slack

```
groovy-agent> slack 1
groovy-agent> slack-actions yesterday
```

**Expected:** Formatted Slack message with blocks → webhook sent → confirmation.

---

## Demo Workflow

```
groovy-agent> process Engineering Standup
⏳ Processing meeting...

# LLM analyzes transcript, extracts structure
# Saves to database

✅ Meeting #1 processed!
💰 Cost: $0.000342

groovy-agent> summary 1
📄 Meeting #1: Engineering Standup (2026-06-19)
Team discussed sprint progress, decided on GraphQL...
Action items: 4 with owners and deadlines.

groovy-agent> actions yesterday
✅ Found action items:
  📋 Engineering Standup (2026-06-19):
    1. Draft architecture document
       👤 Owner: Marcus Johnson
       📅 Deadline: Wednesday

groovy-agent> decisions API architecture
Decisions found:
  📄 Engineering Standup (2026-06-19):
    • Move forward with GraphQL for new customer portal

groovy-agent> slack 1
✅ Meeting summary sent to Slack!
```

---

## Cost Monitoring

Every LLM call logs token usage and estimated cost:

```
2026-06-19T09:00:00.000Z [INFO] [COST] Model: openai/gpt-4o-mini | Input: 1450 tokens | Output: 320 tokens | Total: 1770 tokens | Cost: $0.000409
```

At ~$0.0004 per meeting with `gpt-4o-mini`, you can process thousands of meetings for under a dollar.

---

## Running Tests

```bash
npm test
```

Tests cover:
- Database CRUD operations
- LLM response parsing
- Agent workflow (with API key)
- Error handling for invalid inputs

---

## Error Handling

The agent handles failures gracefully at every level:

| Scenario | Behavior |
|----------|----------|
| Empty/short transcript | Descriptive error message |
| LLM API timeout | Retry with clear error |
| Database write failure | Rollback-safe operations |
| Slack webhook failure | Non-blocking, logged warning |
| Missing API key | Early initialization error |

---

## License

Internal tool — Groovy Engineering
