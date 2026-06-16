import os, sys, json, urllib.request
API_URL = 'https://api.groq.com/openai/v1/chat/completions'
key = os.environ.get('GROQ_API_KEY')
if not key:
    print('GROQ_API_KEY not set'); sys.exit(1)

history = [{"role":"system","content":"You are a helpful assistant."}]

def send(messages):
    data = json.dumps({"model":"llama-3.3-70b-versatile","messages":messages}).encode('utf-8')
    req = urllib.request.Request(API_URL, data=data, headers={
        'Authorization': f'Bearer {key}', 'Content-Type':'application/json', 'User-Agent':'cli-chat/1'
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)['choices'][0]['message']['content']

if len(sys.argv) > 1:
    history.append({"role":"user","content":" ".join(sys.argv[1:])})
    print(send(history)); sys.exit(0)

print('CLI chatbot — type a message, `exit` to quit')
while True:
    try:
        u = input('> ')
    except EOFError:
        break
    if not u or u.strip().lower() in ('exit','quit'):
        break
    history.append({"role":"user","content":u})
    a = send(history)
    print(a)
    history.append({"role":"assistant","content":a})
    if len(history) > 20:
        history = [history[0]] + history[-18:]
