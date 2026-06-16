import os, json, sys
from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.request

API_URL = 'https://api.groq.com/openai/v1/chat/completions'
KEY = os.environ.get('GROQ_API_KEY')
if not KEY:
    print('GROQ_API_KEY not set'); sys.exit(1)

history = [{"role": "system", "content": "You are a helpful assistant."}]
MAX_HISTORY = 50

def send(messages):
    data = json.dumps({"model":"llama-3.3-70b-versatile","messages":messages}).encode('utf-8')
    req = urllib.request.Request(API_URL, data=data, headers={
        'Authorization': f'Bearer {KEY}', 'Content-Type':'application/json', 'User-Agent':'cli-chat/1'
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)['choices'][0]['message']['content']

class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        b = json.dumps(obj).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type','application/json')
        self.send_header('Content-Length', str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_POST(self):
        if self.path != '/chat':
            return self._send(404, {'error':'not found'})
        length = int(self.headers.get('Content-Length','0'))
        body = self.rfile.read(length).decode('utf-8')
        try:
            req = json.loads(body)
            msg = req.get('message','')
        except Exception:
            return self._send(400, {'error':'invalid json'})
        if not msg:
            return self._send(400, {'error':'empty message'})
        history.append({'role':'user','content':msg})
        if len(history) > MAX_HISTORY:
            history[:] = [history[0]] + history[-(MAX_HISTORY-1):]
        try:
            reply = send(history)
        except Exception as e:
            return self._send(500, {'error': str(e)})
        history.append({'role':'assistant','content':reply})
        self._send(200, {'reply':reply, 'history_len': len(history)})

if __name__ == '__main__':
    port = 8000
    server = HTTPServer(('127.0.0.1', port), Handler)
    print(f'Listening on http://127.0.0.1:{port}/chat')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
