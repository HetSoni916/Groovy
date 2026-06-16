import os, sys, json, urllib.request, argparse, time
from dotenv import load_dotenv

load_dotenv()


def _urlopen(url, data, headers, max_retries=5, timeout=30):
    for attempt in range(max_retries):
        req = urllib.request.Request(url, data=data, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < max_retries - 1:
                delay = 2 ** attempt
                print(f'Rate limited, retrying in {delay}s...', file=sys.stderr)
                time.sleep(delay)
                continue
            raise

history = [{"role":"system","content":"You are a helpful assistant."}]


def send_groq(messages):
    key = os.environ.get('GROQ_API_KEY')
    if not key:
        raise RuntimeError('GROQ_API_KEY not set')
    api_url = 'https://api.groq.com/openai/v1/chat/completions'
    data = json.dumps({"model": "llama-3.3-70b-versatile", "messages": messages}).encode('utf-8')
    headers = {'Authorization': f'Bearer {key}', 'Content-Type': 'application/json', 'User-Agent': 'cli-chat/1'}
    return _urlopen(api_url, data, headers)['choices'][0]['message']['content']


def send_gemini(messages):
    key = os.environ.get('GEMINI_API_KEY')
    if not key:
        raise RuntimeError('GEMINI_API_KEY not set')
    system_instruction = None
    contents = []
    for m in messages:
        if m['role'] == 'system':
            system_instruction = m['content']
        elif m['role'] == 'user':
            contents.append({"role": "user", "parts": [{"text": m['content']}]})
        elif m['role'] == 'assistant':
            contents.append({"role": "model", "parts": [{"text": m['content']}]})
    body = {"contents": contents}
    if system_instruction:
        body["system_instruction"] = {"parts": [{"text": system_instruction}]}
    api_url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}'
    data = json.dumps(body).encode('utf-8')
    headers = {'Content-Type': 'application/json', 'User-Agent': 'cli-chat/1'}
    return _urlopen(api_url, data, headers)['candidates'][0]['content']['parts'][0]['text']


def send_cohere(messages):
    key = os.environ.get('COHERE_API_KEY')
    if not key:
        raise RuntimeError('COHERE_API_KEY not set')
    api_url = 'https://api.cohere.com/v2/chat'
    data = json.dumps({"model": "command-r-08-2024", "messages": messages}).encode('utf-8')
    headers = {'Authorization': f'Bearer {key}', 'Content-Type': 'application/json', 'User-Agent': 'cli-chat/1'}
    return _urlopen(api_url, data, headers)['message']['content'][0]['text']


def send(messages, provider='groq'):
    if provider == 'groq':
        return send_groq(messages)
    if provider == 'gemini':
        return send_gemini(messages)
    if provider == 'cohere':
        return send_cohere(messages)
    raise ValueError('unknown provider: ' + str(provider))


def main():
    p = argparse.ArgumentParser(description='CLI chatbot')
    p.add_argument('--provider', '-p', choices=['groq', 'gemini', 'cohere'], default='groq')
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
