# Second-Pass Retrieval with Reranking

## The Problem

First-pass retrieval (embedding cosine similarity or TF-IDF) returns top-K chunks. It's fast but can miss nuance. A chunk might have high keyword overlap but miss the actual answer, or vice versa.

```
Query: "What did the 8-bit microprocessor era enable?"

Chunk A (score 0.72): "...Intel 8080 and Zilog Z80 transformed personal computing..."
Chunk B (score 0.68): "...the 8-bit processors took center stage in the mid-1970s..."
Chunk C (score 0.51): "...The 16-bit architecture facilitated more complex applications..."
```

Chunks A & B are relevant, C is borderline. With first-pass only, you take A, B, C as-is.

## Second-Pass Retrieval

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Query          │     │  First-Pass      │     │  Second-Pass   │
│  "8-bit era..." │────▶│  Embedding/      │────▶│  Reranker      │
│                 │     │  TF-IDF Search   │     │  (Cross-       │
│                 │     │  → top-10 chunks │     │   Encoder)     │
└─────────────────┘     └──────────────────┘     │  → top-3       │
                                                  │   reranked     │
                                                  └────────────────┘
```

**Step 1**: Retrieve top-10 (or top-20) cheaply via embedding similarity.
**Step 2**: For each candidate, compute a **cross-encoder score** — process query + chunk **together** through a model that sees their interaction, not just independent embeddings.

## Cross-Encoder vs Bi-Encoder

| Aspect | Bi-Encoder (Embeddings) | Cross-Encoder (Reranker) |
|--------|------------------------|-------------------------|
| How it works | Encode query and doc separately → cosine similarity | Encode query+doc as one input → relevance score |
| Speed | Fast (O(1) per doc after pre-compute) | Slow (O(n) — must process every pair) |
| Accuracy | Good | **Excellent** (sees token-level interactions) |
| Pre-compute | Embeddings can be pre-computed | Cannot pre-compute (pairwise) |
| Use case | First-pass retrieval (top-10 to top-100) | Second-pass re-ranking (top-3 to top-10) |

## Cohere Reranker

**API**: `POST https://api.cohere.ai/v1/rerank`

**Request**:
```json
{
  "model": "rerank-english-v3.0",
  "query": "What did the 8-bit microprocessor era enable?",
  "documents": [
    "Intel 8080 and Zilog Z80 transformed...",
    "the 8-bit processors took center stage...",
    "..."
  ],
  "top_n": 3
}
```

**Response**:
```json
{
  "results": [
    { "index": 1, "relevance_score": 0.98 },
    { "index": 0, "relevance_score": 0.92 },
    { "index": 5, "relevance_score": 0.45 }
  ]
}
```

**Pricing**: $1/1,000 queries (free tier: 100 queries/month)

## How Much Does Reranking Improve Retrieval?

Typical benchmarks on standard datasets (BEIR, TREC):

| Metric | Bi-Encoder Only | + Reranker (Cohere) | Improvement |
|--------|----------------|-------------------|-------------|
| Recall@3 | 82% | 91% | +9% |
| NDCG@10 | 68% | 82% | +14% |
| Precision@3 | 71% | 88% | +17% |

The gains come from:
1. **Query-doc interaction** — the model sees "8-bit" near "processors" in context, not as separate vectors
2. **Negation and nuance handling** — "not related to 8-bit" won't confuse a cross-encoder
3. **Better ranking of borderline cases** — the reranker can demote false positives from first-pass

## When to Add a Reranker

- ✅ You have **>100 queries/day** (the latency/API cost becomes worth it)
- ✅ You need **high precision** (e.g., legal, medical, enterprise QA)
- ✅ Your first-pass recall is good (>85%) but precision is low (<70%)

- ❌ Small scale (<50 queries/day) — the cost isn't worth marginal gains
- ❌ All queries retrieve from 1 small document — nothing to re-rank
- ❌ Real-time latency-critical apps — each rerank adds 100-500ms

## Our Setup

We have Cohere SDK installed (`cohere-ai`). To enable:

1. Get API key from https://dashboard.cohere.ai
2. Add `COHERE_API_KEY=your_key` to `.env`
3. Set `USE_RERANKER=true` in config

The reranker service (`src/services/reranker.service.ts`) handles:
- Fallback to first-pass results if no API key
- Configurable `topK` for first pass (how many to fetch before reranking)
- Configurable `rerankTopK` (how many to return after reranking)
