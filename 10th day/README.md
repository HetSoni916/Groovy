# Ask My Notes

An AI-powered application that lets you upload PDF notes and ask natural language questions about them. Uses **Anthropic Claude** for answering, with **no vector database** — just intelligent chunking, TF-IDF relevance ranking, and context selection.

## Architecture

```
┌─────────────────────┐     ┌──────────────────────────────────┐
│   React + Vite      │────▶│   Express + TypeScript           │
│   Tailwind CSS      │     │                                  │
│   Chat UI           │     │   /api/pdf/upload                │
│   Cost Telemetry    │     │   /api/pdf/list                  │
│   Source Citations  │     │   /api/pdf/:id                   │
└─────────────────────┘     │   /api/chat/ask                  │
                            │   /api/chat/history              │
                            └──────────┬───────────────────────┘
                                       │
                            ┌──────────▼───────────────────────┐
                            │   Services                      │
                            │   ────────                      │
                            │   PDF Parser  (pdf-parse)       │
                            │   Chunker     (page/paragraph)  │
                            │   Retrieval   (TF-IDF + scoring)│
                            │   Anthropic   (Claude API)      │
                            └─────────────────────────────────┘
```

## Setup

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Installation

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# Frontend
cd ../frontend
npm install
```

### Running

```bash
# Start backend (port 3001)
cd backend
npm run dev

# Start frontend (port 5173)
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | — | Your Anthropic API key |
| `PORT` | `3001` | Backend server port |
| `MAX_FILE_SIZE_MB` | `50` | Max PDF upload size |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/pdf/upload` | Upload a PDF file (multipart/form-data) |
| `GET` | `/api/pdf/list` | List all uploaded documents |
| `DELETE` | `/api/pdf/:id` | Delete a document |
| `POST` | `/api/chat/ask` | Ask a question about your notes |
| `GET` | `/api/chat/history` | Get chat history |
| `DELETE` | `/api/chat/history` | Clear chat history |
| `GET` | `/api/health` | Health check |

## Features

- **PDF Upload** — Drag-and-drop or file picker, validates MIME type and size
- **Smart Chunking** — Splits by page and paragraph boundaries, respects token limits
- **No Vector DB** — TF-IDF scoring + keyword matching + exact phrase bonus
- **Claude Integration** — Answers only from provided context, never external knowledge
- **Source Citations** — Every answer shows which PDF and page number
- **Cost Telemetry** — Token counts, estimated cost, response latency
- **Modern UI** — ChatGPT-style interface with dark theme

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| PDF | pdf-parse |
| AI | Anthropic Claude (Haiku) |
| Storage | JSON files (swappable to real DB) |
