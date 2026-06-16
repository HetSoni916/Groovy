import os, json, argparse, time, sys, random
from dotenv import load_dotenv
import requests

load_dotenv()

PRICING = {
    "groq": {"input": 0.59e-6, "output": 0.79e-6},
    "gemini": {"input": 0.10e-6, "output": 0.40e-6},
    "cohere": {"input": 0.15e-6, "output": 0.60e-6},
}


def _retry(method, url, **kwargs):
    max_retries = kwargs.pop("max_retries", 5)
    for attempt in range(max_retries):
        try:
            r = requests.request(method, url, **kwargs)
            if r.status_code == 429:
                delay = (2 ** attempt) + random.random()
                print(f"  Rate limited, retry in {delay:.1f}s...", file=sys.stderr)
                time.sleep(delay)
                continue
            r.raise_for_status()
            return r
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                delay = (2 ** attempt) + random.random()
                print(f"  {e.__class__.__name__}, retry in {delay:.1f}s...", file=sys.stderr)
                time.sleep(delay)
                continue
            raise


def _tok(s):
    return len(s.split())


# ---- Groq --------------------------------------------------------------------------------------------

def _stream_groq(messages):
    key = os.environ.get("GROQ_API_KEY")
    if not key:
        raise RuntimeError("GROQ_API_KEY not set")
    r = _retry("POST", "https://api.groq.com/openai/v1/chat/completions",
               headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
               json={"model": "llama-3.3-70b-versatile", "messages": messages, "stream": True},
               stream=True, timeout=60)
    for line in r.iter_lines():
        if not line:
            continue
        d = line.decode().strip()
        if not d.startswith("data:"):
            continue
        payload = d[5:].strip()
        if payload == "[DONE]":
            break
        chunk = json.loads(payload)
        delta = chunk["choices"][0]["delta"]
        if "content" in delta:
            yield delta["content"]


def send_groq(messages):
    full = "".join(_stream_groq(messages))
    return full, {"input": _tok(str(messages)), "output": _tok(full)}


# ---- Gemini ----------------------------------------------------------------------------------------

def _build_gemini(messages):
    si, contents = None, []
    for m in messages:
        if m["role"] == "system":
            si = m["content"]
        elif m["role"] == "user":
            contents.append({"role": "user", "parts": [{"text": m["content"]}]})
        elif m["role"] == "assistant":
            contents.append({"role": "model", "parts": [{"text": m["content"]}]})
    body = {"contents": contents}
    if si:
        body["system_instruction"] = {"parts": [{"text": si}]}
    return body


def _stream_gemini(messages):
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("GEMINI_API_KEY not set")
    body = _build_gemini(messages)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key={key}&alt=sse"
    r = _retry("POST", url, headers={"Content-Type": "application/json"}, json=body, stream=True, timeout=60)
    for line in r.iter_lines():
        if not line:
            continue
        d = line.decode()
        if not d.startswith("data: "):
            continue
        chunk = json.loads(d[6:])
        if "candidates" in chunk and chunk["candidates"]:
            for part in chunk["candidates"][0]["content"]["parts"]:
                if "text" in part:
                    yield part["text"]


def send_gemini(messages):
    full = "".join(_stream_gemini(messages))
    return full, {"input": _tok(str(messages)), "output": _tok(full)}


# ---- Cohere ----------------------------------------------------------------------------------------

def _stream_cohere(messages):
    key = os.environ.get("COHERE_API_KEY")
    if not key:
        raise RuntimeError("COHERE_API_KEY not set")
    r = _retry("POST", "https://api.cohere.com/v2/chat",
               headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
               json={"model": "command-r-08-2024", "messages": messages, "stream": True},
               stream=True, timeout=60)
    for line in r.iter_lines():
        if not line:
            continue
        d = line.decode().strip()
        if not d.startswith("data:"):
            continue
        payload = d[5:].strip()
        if payload == "[DONE]":
            break
        chunk = json.loads(payload)
        if chunk.get("type") == "content-delta":
            yield chunk["delta"]["message"]["content"]["text"]


def send_cohere(messages):
    full = "".join(_stream_cohere(messages))
    return full, {"input": _tok(str(messages)), "output": _tok(full)}


# ---- Router ----------------------------------------------------------------------------------------

SEND = {"groq": send_groq, "gemini": send_gemini, "cohere": send_cohere}
STREAM = {"groq": _stream_groq, "gemini": _stream_gemini, "cohere": _stream_cohere}


def format_cost(usage, provider):
    p = PRICING.get(provider)
    if not p:
        return "?"
    return f"${usage['input'] * p['input'] + usage['output'] * p['output']:.6f}"


def format_usage(usage):
    return f"{usage['input']} in / {usage['output']} out"


# ---- CLI ----------------------------------------------------------------------------------------------

def interactive(provider):
    history = [{"role": "system", "content": "You are a helpful assistant."}]
    total_usage = {"input": 0, "output": 0}
    print(f"CLI chatbot v2 — {provider} | /cost /usage | exit to quit")
    while True:
        try:
            u = input("> ")
        except EOFError:
            break
        if not u or u.strip().lower() in ("exit", "quit"):
            break
        if u.strip() == "/cost":
            c = total_usage["input"] * PRICING.get(provider, {}).get("input", 0) + total_usage["output"] * PRICING.get(provider, {}).get("output", 0)
            print(f"  Session: {format_usage(total_usage)}  ${c:.6f}")
            continue
        if u.strip() == "/usage":
            print(f"  Session: {format_usage(total_usage)}")
            continue

        history.append({"role": "user", "content": u})
        stream_fn = STREAM.get(provider)
        print("  ", end="", flush=True)
        full = ""
        start = time.time()
        try:
            for token in stream_fn(history):
                full += token
                print(token, end="", flush=True)
            print()
        except Exception as e:
            print(f"\n  Error: {e}")
            continue

        elapsed = time.time() - start
        history.append({"role": "assistant", "content": full})
        usage = {"input": _tok(u), "output": _tok(full)}
        total_usage["input"] += usage["input"]
        total_usage["output"] += usage["output"]
        print(f"  -- [{elapsed:.1f}s] {format_usage(usage)}  {format_cost(usage, provider)}")

        if len(history) > 20:
            history[:] = [history[0]] + history[-18:]


def main():
    p = argparse.ArgumentParser(description="CLI chatbot v2 — streaming + token counting")
    p.add_argument("--provider", "-p", choices=list(SEND.keys()), default="groq")
    p.add_argument("message", nargs=argparse.REMAINDER)
    args = p.parse_args()

    if args.message:
        msg = " ".join(args.message).strip()
        history = [{"role": "system", "content": "You are a helpful assistant."},
                   {"role": "user", "content": msg}]
        text, usage = SEND[args.provider](history)
        print(text, flush=True)
        print(f"  [{format_usage(usage)}  {format_cost(usage, args.provider)}]")
    else:
        interactive(args.provider)


if __name__ == "__main__":
    main()
