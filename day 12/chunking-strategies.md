# Chunking Strategies for RAG

## Why Chunking Matters

Chunking splits documents into retrievable pieces. Chunk size, overlap, and boundaries directly affect retrieval quality. Too large → irrelevant context dilutes answer. Too small → missing context, fragmented answers.

---

## 1. Fixed-Size Chunking

**How it works**: Split text into equal-sized chunks by token count (e.g., 500 tokens per chunk) with optional overlap.

**Parameters**:
- `chunkSize` (tokens)
- `overlap` (tokens) — typically 10–20% of chunk size

**Pros**: Dead simple, deterministic, fast, no dependencies
**Cons**: Splits in the middle of sentences/paragraphs, loses semantic boundaries

**Our current impl**: Paragraph-atomic fixed-size. Splits on `\n\n`, then merges paragraphs until `chunkTokenLimit` (500). Never cuts mid-paragraph.

**Best for**: Baseline, homogeneous documents, log files

---

## 2. Semantic Chunking

**How it works**: Split at natural semantic boundaries by measuring embedding similarity between consecutive sentences/paragraphs. When similarity drops below a threshold → split.

**Algorithm**:
1. Split text into sentences
2. Embed each sentence (or small group)
3. Compute cosine similarity between consecutive sentences
4. Split where similarity < threshold (e.g., 0.7)
5. Merge small segments that fall below min chunk size

**Pros**: Respects topic boundaries, cleaner context, better retrieval precision
**Cons**: Requires embedding every sentence (compute cost), threshold tuning, slower

**Best for**: Heterogeneous documents with clear topic shifts, research papers, manuals

---

## 3. Sliding Window Chunking

**How it works**: Fixed-size windows that slide over the text with overlap. Each window is a separate chunk.

**Algorithm**:
1. Tokenize full text
2. Extract window of N tokens
3. Slide by stride S (N - overlap)
4. Repeat until end

**Parameters**:
- `windowSize` (e.g., 500 tokens)
- `stride` (e.g., 100 tokens) → overlap = windowSize - stride

**Pros**: Guarantees no information is lost at boundaries, every token appears in at least one chunk
**Cons**: Redundant content across chunks (inflates storage), may still split mid-sentence, bloated vector DB

**Best for**: Question-answering where the answer might span chunk boundaries, continuous text

---

## 4. Hierarchical Chunking

**How it works**: Two-level chunk structure. Small "leaf" chunks (e.g., 100 tokens) grouped into larger "parent" chunks (e.g., 500 tokens). Retrieve at parent level → refine at leaf level.

**Algorithm**:
1. Split into leaf chunks (small, ~100 tokens)
2. Merge consecutive leaves into parent chunks (~500 tokens)
3. Store both levels
4. Query: retrieve top-K parents → expand into leaves → rerank leaves

**Pros**: Multi-granularity — coarse retrieval + fine-grained answer extraction, best precision
**Cons**: Complex implementation, double storage, two-pass retrieval adds latency

**Best for**: Long documents where you need exact answers from broad context, legal/medical docs

---

## Comparison Table

| Strategy       | Precision | Recall | Compute Cost | Storage | Impl Complexity | Boundary Respect |
|---------------|-----------|--------|-------------|---------|----------------|-----------------|
| Fixed-size    | Medium    | Medium | Low         | Low     | Very Low       | Poor            |
| Semantic      | High      | High   | Medium+     | Low     | High           | Excellent       |
| Sliding Window| Medium    | Very High | Low      | High    | Low            | Poor            |
| Hierarchical  | Very High | High   | High        | High    | Very High      | Good            |

## When to Use What

- **Fixed-size**: Baseline, prototyping, simple Q&A
- **Semantic**: Production RAG on diverse docs, research papers
- **Sliding Window**: Recall-critical apps (legal discovery, compliance)
- **Hierarchical**: Enterprise RAG, long documents, highest accuracy requirements
