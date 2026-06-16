import csv, os, time
from pathlib import Path

LOG_FILE = Path(__file__).parent / "api_log.csv"
FIELDS = ["timestamp", "provider", "model", "input_tokens", "output_tokens",
          "cost", "latency_s", "prompt_preview", "response_preview"]

MODELS = {
    "groq": "llama-3.3-70b-versatile",
    "gemini": "gemini-2.0-flash",
    "cohere": "command-r-08-2024",
}

PRICING = {
    "groq": {"input": 0.59e-6, "output": 0.79e-6},
    "gemini": {"input": 0.10e-6, "output": 0.40e-6},
    "cohere": {"input": 0.15e-6, "output": 0.60e-6},
}


def _cost(usage, provider):
    p = PRICING.get(provider)
    if not p:
        return 0
    return usage["input"] * p["input"] + usage["output"] * p["output"]


def _preview(text, n=60):
    t = text.replace("\n", " ").strip()
    return t[:n] + "..." if len(t) > n else t


def log_call(provider, usage, latency_s, prompt, response):
    exists = LOG_FILE.exists()
    row = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "provider": provider,
        "model": MODELS.get(provider, "?"),
        "input_tokens": usage["input"],
        "output_tokens": usage["output"],
        "cost": round(_cost(usage, provider), 8),
        "latency_s": round(latency_s, 2),
        "prompt_preview": _preview(prompt),
        "response_preview": _preview(response),
    }
    with open(LOG_FILE, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        if not exists:
            w.writeheader()
        w.writerow(row)
