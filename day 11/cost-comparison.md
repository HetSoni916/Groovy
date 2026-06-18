# Cost Comparison: Full-Doc vs RAG Approach

## Assumptions
- **LLM**: Groq Llama 3.3 70B ($0.59/M input tokens, $0.79/M output tokens)
- **Embedding**: Local `all-MiniLM-L6-v2` (free, $0)
- **ChromaDB**: Local (free, $0)
- **Avg output**: 150 tokens per answer

---

## Scenario 1: Small PDF (~500 words, ~650 tokens)

| Metric | Full-Doc | RAG (top 3 chunks) |
|--------|----------|-------------------|
| Context sent | Entire PDF: **650 tokens** | 3 chunks × 500 = **1,500 tokens** |
| Total input | 650 + 20 (question) + 150 (system) = **820** | 1,500 + 20 + 150 = **1,670** |
| Input cost | 820 / 1M × $0.59 = **$0.00048** | 1,670 / 1M × $0.59 = **$0.00099** |
| Output cost | 150 / 1M × $0.79 = **$0.00012** | 150 / 1M × $0.79 = **$0.00012** |
| **Total cost** | **$0.00060** | **$0.00111** |
| Embedding cost | $0 | $0 (local) |
| Quality | ✅ All context | ✅ Focused, no noise |

---

## Scenario 2: Medium PDF (~5,000 words, ~6,500 tokens)

| Metric | Full-Doc | RAG (top 3 chunks) |
|--------|----------|-------------------|
| Context sent | Entire PDF: **6,500 tokens** | 3 chunks × 500 = **1,500 tokens** |
| Total input | 6,500 + 20 + 150 = **6,670** | 1,500 + 20 + 150 = **1,670** |
| Input cost | 6,670 / 1M × $0.59 = **$0.00394** | 1,670 / 1M × $0.59 = **$0.00099** |
| Output cost | 150 / 1M × $0.79 = **$0.00012** | 150 / 1M × $0.79 = **$0.00012** |
| **Total cost** | **$0.00406** | **$0.00111** |
| Savings | — | **73% cheaper** |

---

## Scenario 3: Large PDF (~50,000 words, ~65,000 tokens)

| Metric | Full-Doc | RAG (top 3 chunks) |
|--------|----------|-------------------|
| Context sent | Entire PDF: **65,000 tokens** | 3 chunks × 500 = **1,500 tokens** |
| Total input | 65,000 + 20 + 150 = **65,170** | 1,500 + 20 + 150 = **1,670** |
| Input cost | 65,170 / 1M × $0.59 = **$0.03845** | 1,670 / 1M × $0.59 = **$0.00099** |
| Output cost | 150 / 1M × $0.79 = **$0.00012** | 150 / 1M × $0.79 = **$0.00012** |
| **Total cost** | **$0.03857** | **$0.00111** |
| Savings | — | **97% cheaper** |

---

## Scenario 4: 1,000 queries/day on Large PDFs

| Metric | Full-Doc | RAG |
|--------|----------|-----|
| Cost per query | $0.03857 | $0.00111 |
| **Daily cost** | **$38.57** | **$1.11** |
| **Monthly cost** | **$1,157.10** | **$33.30** |
| **Yearly cost** | **$14,078** | **$405** |
| Savings | — | **97% cheaper** |

---

## Other Factors

| Factor | Full-Doc | RAG |
|--------|----------|-----|
| Context window limit | ❌ Hits limit on large PDFs (>8K tokens) | ✅ Always fits (fixed 1.5K context) |
| Accuracy | ❌ Irrelevant sections cause hallucination | ✅ Focused context = better answers |
| Latency | ❌ Processes thousands of tokens | ✅ Faster (smaller prompt = less compute) |
| Scalability | ❌ Linear cost with document size | ✅ Fixed cost regardless of document size |
| Answer quality | ⚠️ Diluted by irrelevant content | ✅ Higher precision per answer |

## Verdict

RAG is **always better** for:
- Documents >1,000 words (cost savings kick in)
- Multi-document search (impossible with full-doc)
- Scalable applications (fixed cost per query)

Full-doc only wins for:
- Ultra-small documents (<500 words) — slightly cheaper
- When 100% of the document is relevant to every question (rare)
