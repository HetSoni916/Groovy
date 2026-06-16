import os, json, sys
from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.request

GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
GEMINI_API_URL = 'https://api.gemini.com/v1/chat/completions'
COHERE_API_URL = 'https://api.cohere.ai/v1/chat'
GROQ_KEY = os.environ.get('GROQ_API_KEY')
OPENAI_KEY = os.environ.get('OPENAI_API_KEY')
GEMINI_KEY = os.environ.get('GEMINI_API_KEY')
COHERE_KEY = os.environ.get('COHERE_API_KEY')

history = [{"role": "system", "content": "You are a helpful assistant."}]
MAX_HISTORY = 50


def send_groq(messages):
    if not GROQ_KEY:
        raise RuntimeError('GROQ_API_KEY not set')
    data = json.dumps({"model": "llama-3.3-70b-versatile", "messages": messages}).encode('utf-8')
    req = urllib.request.Request(GROQ_API_URL, data=data, headers={
        'Authorization': f'Bearer {GROQ_KEY}', 'Content-Type': 'application/json', 'User-Agent': 'cli-chat/1'
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)['choices'][0]['message']['content']


def send_openai(messages):
    if not OPENAI_KEY:
        raise RuntimeError('OPENAI_API_KEY not set')
    data = json.dumps({"model": "gpt-4o-mini", "messages": messages}).encode('utf-8')
    req = urllib.request.Request(OPENAI_API_URL, data=data, headers={
        'Authorization': f'Bearer {OPENAI_KEY}', 'Content-Type': 'application/json', 'User-Agent': 'cli-chat/1'
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)['choices'][0]['message']['content']


def send_local(messages):
    last = next((m for m in reversed(messages) if m.get('role') == 'user'), None)
    return f"(local) Echo: {last.get('content','') if last else ''}"


def send(messages, provider='groq'):
    if provider == 'groq':
        return send_groq(messages)
    if provider == 'openai':
        return send_openai(messages)
    if provider == 'gemini':
        if not GEMINI_KEY:
            raise RuntimeError('GEMINI_API_KEY not set')
        data = json.dumps({"model": "gemini-proto", "messages": messages}).encode('utf-8')
        req = urllib.request.Request(GEMINI_API_URL, data=data, headers={
            'Authorization': f'Bearer {GEMINI_KEY}', 'Content-Type': 'application/json', 'User-Agent': 'cli-chat/1'
        })
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)['choices'][0]['message']['content']
    if provider == 'cohere':
        if not COHERE_KEY:
            raise RuntimeError('COHERE_API_KEY not set')
        data = json.dumps({"model": "command-xlarge", "messages": messages}).encode('utf-8')
        req = urllib.request.Request(COHERE_API_URL, data=data, headers={
            'Authorization': f'Bearer {COHERE_KEY}', 'Content-Type': 'application/json', 'User-Agent': 'cli-chat/1'
        })
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)['choices'][0]['message']['content']
    if provider == 'local':
        return send_local(messages)
    raise ValueError('unknown provider: ' + str(provider))

PAGE = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Local Chatbot</title>
  <style>body{font-family:sans-serif;margin:2rem}textarea{width:100%;height:80px}button{padding:0.6rem 1rem;margin-top:0.5rem}pre{white-space:pre-wrap;word-wrap:break-word;background:#f5f5f5;padding:1rem;border-radius:8px}</style>
</head>
<body>
  <h1>Local Chatbot</h1>
    <p>Enter a message, choose a provider, then click Send. The server will POST to <code>/chat</code>.</p>
    <label for="provider">Provider:</label>
    <select id="provider">
        <option value="groq">groq</option>
        <option value="openai">openai</option>
        <option value="gemini">gemini</option>
        <option value="cohere">cohere</option>
        <option value="local">local</option>
    </select>
    <br>
    <textarea id="prompt" placeholder="Say something..."></textarea>
  <br>
  <button id="send">Send</button>
  <h2>Reply</h2>
  <pre id="response"></pre>
  <script>
    const resp = document.getElementById('response');
    document.getElementById('send').onclick = async () => {
      const message = document.getElementById('prompt').value;
      if (!message.trim()) return;
      resp.textContent = 'Waiting...';
      try {
                const provider = document.getElementById('provider').value || 'groq';
                const r = await fetch('/chat', {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({message, provider})
                });
        if (!r.ok) throw new Error(await r.text());
        const data = await r.json();
        resp.textContent = data.reply;
      } catch (err) {
        resp.textContent = err.toString();
      }
    };
  </script>
</body>
</html>
'''

class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        b = json.dumps(obj).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type','application/json')
        self.send_header('Content-Length', str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        if self.path != '/':
            self.send_response(404)
            self.send_header('Content-Type','text/plain')
            self.end_headers()
            self.wfile.write(b'Not found')
            return
        data = PAGE.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type','text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if self.path != '/chat':
            return self._send(404, {'error':'not found'})
        length = int(self.headers.get('Content-Length','0'))
        body = self.rfile.read(length).decode('utf-8')
        try:
            req = json.loads(body)
            msg = req.get('message','')
            provider = req.get('provider','groq')
        except Exception:
            return self._send(400, {'error':'invalid json'})
        if not msg:
            return self._send(400, {'error':'empty message'})
        history.append({'role':'user','content':msg})
        if len(history) > MAX_HISTORY:
            history[:] = [history[0]] + history[-(MAX_HISTORY-1):]
        try:
            reply = send(history, provider=provider)
        except Exception as e:
            return self._send(500, {'error': str(e)})
        history.append({'role':'assistant','content':reply})
        self._send(200, {'reply':reply, 'history_len': len(history)})

if __name__ == '__main__':
    port = 8000
    server = HTTPServer(('127.0.0.1', port), Handler)
    print(f'Listening on http://127.0.0.1:{port}/')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
