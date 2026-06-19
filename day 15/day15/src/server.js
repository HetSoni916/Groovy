import express from 'express';
import cors from 'cors';
import { MeetingAgent } from './agent/meetingAgent.js';
import { closeDb } from './database/connection.js';
import { log } from './logger.js';
import { env } from './config/env.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static('public'));

let agent;

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

app.post('/api/process', asyncHandler(async (req, res) => {
  const { title, transcript, participants, date } = req.body;

  if (!title || !transcript) {
    return res.status(400).json({ error: 'title and transcript are required' });
  }

  log('API', `POST /api/process — "${title}"`);
  const result = await agent.processTranscript(title, transcript, participants || [], date);
  res.json({ success: true, meeting: result });
}));

app.get('/api/meetings/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const meeting = agent.database.getMeeting(id);

  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }

  res.json({ success: true, meeting });
}));

app.get('/api/meetings', asyncHandler(async (req, res) => {
  const query = req.query.q;
  const limit = parseInt(req.query.limit, 10) || 20;

  let meetings;
  if (query) {
    meetings = agent.database.searchMeetings(query);
  } else {
    meetings = agent.database.getRecentMeetings(limit);
  }

  res.json({ success: true, meetings });
}));

app.get('/api/actions', asyncHandler(async (req, res) => {
  const query = req.query.q || 'recent';
  const result = await agent.getActionItems(query);
  res.json({ success: true, ...result });
}));

app.get('/api/decisions', asyncHandler(async (req, res) => {
  const query = req.query.q || '';
  const result = await agent.getDecisions(query);
  res.json({ success: true, ...result });
}));

app.post('/api/slack/meeting/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const meeting = agent.database.getMeeting(id);

  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }

  const slackResult = await agent.sendToSlack(meeting);
  res.json({ success: true, slack: slackResult });
}));

app.post('/api/slack/actions', asyncHandler(async (req, res) => {
  const query = req.body.query || 'recent';
  const result = await agent.sendActionItemsToSlack(query);
  res.json({ success: true, ...result });
}));

app.post('/api/slack/decisions', asyncHandler(async (req, res) => {
  const query = req.body.query || '';
  const decisionsResult = await agent.getDecisions(query);

  if (!decisionsResult.found) {
    return res.status(404).json({ error: decisionsResult.message });
  }

  const allDecisions = decisionsResult.meetings.flatMap(m => m.decisions);
  const slackResult = await agent.slack.sendDecisions(allDecisions);
  res.json({ success: true, slack: slackResult });
}));

app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    provider: env.LLM_PROVIDER,
    model: env.LLM_PROVIDER === 'groq' ? env.GROQ_MODEL : env.LLM_PROVIDER === 'anthropic' ? env.ANTHROPIC_MODEL : env.OPENAI_MODEL,
    slack: !!env.SLACK_WEBHOOK_URL,
    uptime: process.uptime(),
  });
});

app.use((err, req, res, _next) => {
  log('API', `Error: ${err.message}`, 'ERROR');
  res.status(500).json({ error: err.message });
});

async function start() {
  agent = new MeetingAgent();
  log('SERVER', `Agent initialized (${env.LLM_PROVIDER})`);

  app.listen(env.PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║      Groovy AI Meeting Summary Agent — Server       ║
╠══════════════════════════════════════════════════════╣
║  LLM:     ${(env.LLM_PROVIDER + '/' + (env.LLM_PROVIDER === 'groq' ? env.GROQ_MODEL : env.LLM_PROVIDER === 'anthropic' ? env.ANTHROPIC_MODEL : env.OPENAI_MODEL)).padEnd(40)}║
║  Slack:   ${(env.SLACK_WEBHOOK_URL ? '✓ Configured' : '✗ Not configured').padEnd(40)}║
║  Port:    ${String(env.PORT).padEnd(40)}║
╚══════════════════════════════════════════════════════╝
    `);
    log('SERVER', `Listening on http://localhost:${env.PORT}`);
  });
}

start().catch(err => {
  log('SERVER', `Fatal: ${err.message}`, 'ERROR');
  process.exit(1);
});

process.on('SIGINT', () => {
  log('SERVER', 'Shutting down...');
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDb();
  process.exit(0);
});
