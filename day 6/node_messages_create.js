const https = require('https');

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.error('GROQ_API_KEY not set in environment. Set it and re-run.');
  process.exit(1);
}

const payload = JSON.stringify({
  model: 'llama-3.3-70b-versatile',
  messages: [{ role: 'user', content: 'Hello, introduce yourself' }]
});

const req = https.request(API_URL, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('HTTP', res.statusCode);
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(payload);
req.end();
