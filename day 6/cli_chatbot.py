import os, sys, json, urllib.request, argparse

history = [{"role":"system","content":"You are a helpful assistant."}]


def send_groq(messages):
    key = os.environ.get('GROQ_API_KEY')
    if not key:
        raise RuntimeError('GROQ_API_KEY not set')
    api_url = 'https://api.groq.com/openai/v1/chat/completions'
    data = json.dumps({"model": "llama-3.3-70b-versatile", "messages": messages}).encode('utf-8')
    req = urllib.request.Request(api_url, data=data, headers={
        'Authorization': f'Bearer {key}', 'Content-Type': 'application/json', 'User-Agent': 'cli-chat/1'
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)['choices'][0]['message']['content']


def send_openai(messages):
    key = os.environ.get('OPENAI_API_KEY')
    if not key:
        raise RuntimeError('OPENAI_API_KEY not set')
    api_url = 'https://api.openai.com/v1/chat/completions'
    data = json.dumps({"model": "gpt-4o-mini", "messages": messages}).encode('utf-8')
    req = urllib.request.Request(api_url, data=data, headers={
        'Authorization': f'Bearer {key}', 'Content-Type': 'application/json', 'User-Agent': 'cli-chat/1'
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)['choices'][0]['message']['content']


def send_gemini(messages):
    key = os.environ.get('GEMINI_API_KEY')
    if not key:
        raise RuntimeError('GEMINI_API_KEY not set')
    api_url = 'https://api.gemini.com/v1/chat/completions'
    data = json.dumps({"model": "gemini-proto", "messages": messages}).encode('utf-8')
    req = urllib.request.Request(api_url, data=data, headers={
        'Authorization': f'Bearer {key}', 'Content-Type': 'application/json', 'User-Agent': 'cli-chat/1'
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)['choices'][0]['message']['content']


def send_cohere(messages):
    key = os.environ.get('COHERE_API_KEY')
    if not key:
        raise RuntimeError('COHERE_API_KEY not set')
    api_url = 'https://api.cohere.ai/v1/chat'
    data = json.dumps({"model": "command-xlarge", "messages": messages}).encode('utf-8')
    req = urllib.request.Request(api_url, data=data, headers={
        'Authorization': f'Bearer {key}', 'Content-Type': 'application/json', 'User-Agent': 'cli-chat/1'
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)['choices'][0]['message']['content']


def send_local(messages):
    # simple local provider: echo last user message prefixed
    last = next((m for m in reversed(messages) if m.get('role') == 'user'), None)
    return f"(local) Echo: {last.get('content','') if last else ''}"


def send(messages, provider='groq'):
    if provider == 'groq':
        return send_groq(messages)
    if provider == 'openai':
        return send_openai(messages)
    if provider == 'gemini':
        return send_gemini(messages)
    if provider == 'cohere':
        return send_cohere(messages)
    if provider == 'local':
        return send_local(messages)
    raise ValueError('unknown provider: ' + str(provider))


def main():
    p = argparse.ArgumentParser(description='CLI chatbot')
    p.add_argument('--provider', '-p', choices=['groq', 'openai', 'gemini', 'cohere', 'local'], default='groq')
    p.add_argument('message', nargs=argparse.REMAINDER)
    args = p.parse_args()
    provider = args.provider
    if args.message:
        history.append({"role": "user", "content": " ".join(args.message).strip()})
        print(send(history, provider=provider))
        return

    print('CLI chatbot — type a message, `exit` to quit (provider=' + provider + ')')
    while True:
        try:
            u = input('> ')
        except EOFError:
            break
        if not u or u.strip().lower() in ('exit', 'quit'):
            break
        history.append({"role": "user", "content": u})
        try:
            a = send(history, provider=provider)
        except Exception as e:
            print('Error:', e)
            continue
        print(a)
        history.append({"role": "assistant", "content": a})
        if len(history) > 20:
            history[:] = [history[0]] + history[-18:]


if __name__ == '__main__':
    main()
