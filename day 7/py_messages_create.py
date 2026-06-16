import os
import sys
import json
import urllib.request

api_key = os.environ.get('GROQ_API_KEY')
if not api_key:
    print('GROQ_API_KEY not set in environment. Set it and re-run.', file=sys.stderr)
    sys.exit(1)

url = "https://api.groq.com/openai/v1/chat/completions"
payload = json.dumps({
    "model": "llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "Hello, introduce yourself"}]
}).encode('utf-8')

req = urllib.request.Request(url, data=payload, headers={
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json',
    'User-Agent': 'python-urllib/3'
})

try:
    with urllib.request.urlopen(req) as resp:
        body = resp.read().decode('utf-8')
        try:
            obj = json.loads(body)
            print(json.dumps(obj, indent=2))
        except Exception:
            print(body)
except urllib.error.HTTPError as e:
    print('HTTP Error:', e.code, e.reason, file=sys.stderr)
    print(e.read().decode(), file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print('Request failed:', str(e), file=sys.stderr)
    sys.exit(1)
