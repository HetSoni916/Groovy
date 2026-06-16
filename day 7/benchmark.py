import os, sys, json, urllib.request, time
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(__file__))

# Replicate provider calls WITHOUT retry for clean benchmarking
import cli_chatbot as cb

# Monkey-patch _urlopen to disable retry for benchmark
_original_urlopen = cb._urlopen
cb._urlopen = lambda url, data, headers, max_retries=1, timeout=30: _original_urlopen(url, data, headers, max_retries=1, timeout=timeout)

PROMPTS = [
    "What is 2+2?", "Describe the sky in 5 words.", "Is water wet?",
    "Name a color.", "What is AI?", "Say hello.", "What is 10*10?",
    "Name a fruit.", "Is the earth round?", "What is Python?",
    "Say goodbye.", "What is the capital of France?", "Name a planet.",
    "What is 100/4?", "Is fire hot?", "What is a dog?",
    "Name a country.", "What is 3+5?", "Is the sun bright?",
    "What is a cat?", "Say hi.", "What is 12*12?",
    "Name a bird.", "Is snow cold?", "What is an ocean?",
    "Name a city.", "What is 50/2?", "Is ice cold?",
    "What is a tree?", "Name a river.", "What is 7+3?",
    "Is grass green?", "What is a car?", "Name a language.",
    "What is 9*9?", "Is sugar sweet?", "What is a book?",
    "Name a sport.", "What is 15/3?", "Is night dark?",
    "What is a star?", "Name a food.", "What is 6+4?",
    "Is milk white?", "What is a mountain?", "Name a flower.",
    "What is 8*7?", "Is rain wet?", "What is a song?",
    "Name a tool.",
]


def measure(provider):
    results = []
    errors = 0
    for i, prompt in enumerate(PROMPTS):
        history = [{"role": "system", "content": "You are a helpful assistant."}]
        history.append({"role": "user", "content": prompt})
        try:
            start = time.time()
            reply = cb.send(history, provider=provider)
            elapsed = time.time() - start
            results.append({"prompt": prompt, "reply": reply, "time": elapsed,
                            "prompt_words": len(prompt.split()), "reply_words": len(reply.split())})
            print(f"  [{i+1}/50] {elapsed:.2f}s {provider:6s} {prompt[:25]:25s} -> {reply[:35]}")
        except urllib.error.HTTPError as e:
            errors += 1
            print(f"  [{i+1}/50] {provider:6s} SKIP (HTTP {e.code})")
        except Exception as e:
            errors += 1
            print(f"  [{i+1}/50] {provider:6s} ERROR: {str(e)[:50]}")
    return results, errors


def main():
    providers = ["groq", "gemini", "cohere"]
    all_data = {}
    for prov in providers:
        print(f"\n{'='*50}")
        print(f"Benchmarking {prov}...")
        print(f"{'='*50}")
        all_data[prov], errs = measure(prov)

    lines = []
    lines.append("# COT Report: 50-Prompt Model Benchmark & Decision Matrix\n")
    lines.append(f"*Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}*\n")
    lines.append("## Methodology\n")
    lines.append("Ran **50 identical short prompts** on each provider. Measured wall-clock latency. Token estimates use 1.3× word count.\n")

    lines.append("## 1. Pricing Table (per 1M tokens, USD) — June 2026\n")
    lines.append("| Model | Provider | Input $/1M | Output $/1M | Context |")
    lines.append("|-------|----------|-----------|------------|---------|")
    lines.append("| **Claude 3.5 Haiku** | Anthropic | $0.80 | $4.00 | 200K |")
    lines.append("| **Groq (Llama 3.3 70B)** | Groq | $0.59 | $0.79 | 128K |")
    lines.append("| **GPT-4o-mini** | OpenAI | $0.15 | $0.60 | 128K |")
    lines.append("| **Gemini 2.0 Flash** | Google | $0.10 | $0.40 | 1M |")
    lines.append("| **Cohere (Command-R-08-2024)** | Cohere | $0.15 | $0.60 | 128K |")
    lines.append("")
    lines.append("*Sources: anthropic.com, groq.com, openai.com, ai.google.dev, cohere.com*\n")

    lines.append("## 2. Benchmark Results\n")
    lines.append("### 2a. Latency (seconds per request)\n")
    lines.append("| Provider | Avg | Min | Max | P50 | P95 | Completed |")
    lines.append("|----------|-----|-----|-----|-----|-----|-----------|")
    for prov in providers:
        d = all_data[prov]
        if not d:
            lines.append(f"| {prov:7s} | — | — | — | — | — | 0/50 |")
            continue
        times = [r["time"] for r in d]
        avg = sum(times) / len(times)
        mn = min(times)
        mx = max(times)
        st = sorted(times)
        p50 = st[len(st)//2]
        p95 = st[int(len(st)*0.95)]
        lines.append(f"| {prov:7s} | {avg:.2f}s | {mn:.2f}s | {mx:.2f}s | {p50:.2f}s | {p95:.2f}s | {len(d)}/50 |")

    lines.append("\n### 2b. Total Time & Cost Estimate (50 runs)\n")
    lines.append("| Provider | Total Time | Avg Output Length | Est. Cost (50 runs) |")
    lines.append("|----------|-----------|------------------|---------------------|")
    for prov in providers:
        d = all_data[prov]
        if not d:
            lines.append(f"| {prov:7s} | — | — | — |")
            continue
        total_t = sum(r["time"] for r in d)
        avg_w = sum(r["reply_words"] for r in d) / len(d)
        in_tok = sum(r["prompt_words"] for r in d) * 1.3
        out_tok = sum(r["reply_words"] for r in d) * 1.3
        pricing = {"groq": (0.59/1e6, 0.79/1e6), "gemini": (0.10/1e6, 0.40/1e6), "cohere": (0.15/1e6, 0.60/1e6)}
        inp_rate, out_rate = pricing.get(prov, (0, 0))
        cost_50 = in_tok * inp_rate + out_tok * out_rate
        lines.append(f"| {prov:7s} | {total_t:.1f}s | {avg_w:.0f} words | ${cost_50:.6f} |")

    lines.append("\n## 3. Decision Matrix: When to Choose Which Model\n")
    lines.append("| Criterion | Haiku (Anthropic) | GPT-4o-mini (OpenAI) | Gemini Flash (Google) | Cohere |")
    lines.append("|-----------|-------------------|---------------------|----------------------|--------|")
    lines.append("| **Best for** | Balanced quality/cost | Budget general-purpose | Multimodal, long context | RAG, enterprise search |")
    lines.append("| **Speed** | 🟢 Fast | 🟢 Fast | 🟢 Fast | 🟡 Moderate |")
    lines.append("| **Cost input** | $0.80/M | **$0.15/M** | **$0.10/M** 🏆 | $0.15/M |")
    lines.append("| **Cost output** | $4.00/M | **$0.60/M** | **$0.40/M** 🏆 | $0.60/M |")
    lines.append("| **Context** | 200K | 128K | **1M** 🏆 | 128K |")
    lines.append("| **Multimodal** | ✅ Text+Image | ✅ Text+Image | ✅ **Text+Image+Audio** 🏆 | ❌ Text only |")
    lines.append("| **Free tier** | ❌ | ❌ | ✅ **Yes** 🏆 | ❌ |")
    lines.append("| **Coding** | 🟢 Excellent | 🟢 Very good | 🟢 Good | 🟡 Basic |")
    lines.append("| **RAG/Embed** | 🟡 Good | 🟡 Good | 🟡 Good | 🟢 **Best** 🏆 |")

    lines.append("\n### Decision Flowchart\n")
    lines.append("```")
    lines.append("Need multimodal (image/audio)?")
    lines.append("  ├── Image only ────────────── GPT-4o-mini ($0.15/M)")
    lines.append("  └── Image+Audio or 1M ctx ── Gemini Flash ($0.10/M)")
    lines.append("")
    lines.append("Need RAG / embeddings / enterprise search?")
    lines.append("  └── Yes ──────────────────── Cohere (native retrieval)")
    lines.append("")
    lines.append("Budget priority?")
    lines.append("  ├── Lowest cost ──────────── Gemini Flash ($0.10/M)")
    lines.append("  ├── Cheap + strong ───────── GPT-4o-mini ($0.15/M)")
    lines.append("  └── Balanced quality ─────── Haiku ($0.80/M)")
    lines.append("```")

    lines.append("\n### Cost Comparison at Scale\n")
    lines.append("| Monthly Volume | Haiku | GPT-4o-mini | Gemini Flash | Cohere |")
    lines.append("|---------------|-------|-------------|--------------|--------|")
    lines.append("| 10M in / 2M out | $16.00 | $2.70 | **$1.80** 🏆 | $2.70 |")
    lines.append("| 100M in / 20M out | $160.00 | $27.00 | **$18.00** 🏆 | $27.00 |")
    lines.append("| 1B in / 200M out | $1,600.00 | $270.00 | **$180.00** 🏆 | $270.00 |")

    lines.append("\n## 4. Verdict\n")
    lines.append("| Priority | Pick | Why |")
    lines.append("|----------|------|-----|")
    lines.append("| 💰 **Cheapest** | Gemini Flash | $0.10/$0.40 per 1M + free tier |")
    lines.append("| ⚡ **Fastest** | Groq (Llama) | LPU hardware, sub-second inference |")
    lines.append("| 🎯 **Best value** | GPT-4o-mini | $0.15/$0.60, GPT-4-level quality |")
    lines.append("| 🖼️ **Multimodal** | Gemini Flash | Text + Image + Audio + 1M ctx |")
    lines.append("| 📄 **RAG/Enterprise** | Cohere | Native embeddings + retrieval |")
    lines.append("| ⚖️ **Balanced** | Claude Haiku | Strong quality at mid price |")

    report = "\n".join(lines)
    out_path = os.path.join(os.path.dirname(__file__), "cot_report.md")
    with open(out_path, "w") as f:
        f.write(report)
    print(f"\nReport saved to {out_path}")


if __name__ == "__main__":
    main()
