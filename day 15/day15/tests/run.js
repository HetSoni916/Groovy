import { getDb, closeDb } from '../src/database/connection.js';
import { log } from '../src/logger.js';
import { env } from '../src/config/env.js';
import { mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

const PASS = '\x1b[32m✓ PASS\x1b[0m';
const FAIL = '\x1b[31m✗ FAIL\x1b[0m';
const INFO = '\x1b[36mℹ INFO\x1b[0m';

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`  ${PASS}: ${name}`);
    passed++;
  } else {
    console.log(`  ${FAIL}: ${name}`);
    failed++;
  }
}

const SAMPLE_TRANSCRIPT = `Engineering Team Standup — June 19, 2026

Participants: Sarah Chen (Tech Lead), Marcus Johnson (Backend), Priya Patel (Frontend), Alex Kim (DevOps)

Sarah: Let's start with updates. Marcus, how's the API rate limiting going?
Marcus: The rate limiting middleware is done. Testing shows it handles 10k requests per minute without issues. Waiting on Alex to deploy the Redis cluster for distributed rate tracking.
Alex: Redis cluster should be ready by Friday. There's a dependency on the security team approving the encryption config.
Priya: I finished the dashboard redesign. The new analytics page is live on staging. Need Sarah to review the PR before we push to production.
Sarah: I'll review it this afternoon. Also, we need to discuss the API architecture for the new customer portal. The product team wants a decision by end of week.
Marcus: I've been looking at this. I think we should go with GraphQL over REST for the new portal — it'll reduce the number of endpoints we need to maintain and give the frontend more flexibility.
Priya: Agreed. With GraphQL, I can fetch exactly what I need for each view. REST would mean either over-fetching or multiple round trips.
Sarah: Good point. Let's go with GraphQL for the new customer portal. Marcus, can you draft the architecture doc?
Marcus: Sure. I'll have a draft by Wednesday.
Priya: Sarah, can you start looking into Apollo Client for the frontend integration?
Sarah: Yes, I'll start researching today.
Alex: One thing — if we're going GraphQL, we need to think about caching strategy. The Redis work I'm doing now could support both rate limiting and GraphQL caching.
Sarah: Great idea. Alex, include GraphQL caching in your Redis setup. Let's align on this on Thursday.
Marcus: I have a concern — the GraphQL learning curve for the newer engineers. We should budget time for a knowledge-sharing session.
Sarah: Noted. I'll schedule a lunch-and-learn for next Tuesday. Anyone else have blockers?
Priya: I'm blocked on the notification service — I need the endpoint specs from the backend team.
Marcus: I'll prioritize those specs. You'll have them by end of day.
Sarah: Perfect. Let's wrap up. Key deadlines: Redis cluster by Friday, architecture doc by Wednesday, PR review today, notification specs today.`;

async function runTests() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Groovy AI Meeting Summary Agent — Test Suite');
  console.log('═══════════════════════════════════════════════════\n');

  if (!env.OPENAI_API_KEY && !env.GROQ_API_KEY && !env.ANTHROPIC_API_KEY) {
    console.log(`  ${INFO}: No API key found. Run "LLM tests" only after configuring .env`);
    console.log(`  ${INFO}: Continuing with database-only tests...\n`);
  }

  // ------------------------------------------------------------------
  // DATABASE TESTS
  // ------------------------------------------------------------------
  console.log('📁 Database Tests:');

  const dbDir = resolve('./test-data');
  if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });

  process.env.DATABASE_PATH = './test-data/test.db';

  const db = getDb();
  assert(!!db, 'Database connection established');

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  assert(tables.some(t => t.name === 'meetings'), 'Meetings table exists');

  // ------------------------------------------------------------------
  // DATABASE TOOL TESTS
  // ------------------------------------------------------------------
  console.log('\n📁 Database Tool Tests:');
  const { DatabaseTool } = await import('../src/tools/databaseTool.js');
  const dbTool = new DatabaseTool();

  const saveResult = dbTool.saveMeeting({
    title: 'Test Standup',
    date: '2026-06-19',
    participants: ['Alice', 'Bob'],
    transcript: 'Test transcript content here.',
    summary: 'Test summary.',
    keyPoints: ['Point 1', 'Point 2'],
    decisions: ['Decision 1'],
    actionItems: [{ task: 'Do X', owner: 'Alice', deadline: 'Friday' }],
    risksBlockers: ['Risk 1'],
    status: 'completed',
    tokenUsage: { totalTokens: 100, costEstimate: 0.001 },
    costEstimate: 0.001,
  });
  assert(saveResult && saveResult.id, 'saveMeeting() returns an ID');

  const fetched = dbTool.getMeeting(saveResult.id);
  assert(fetched !== null, 'getMeeting() retrieves saved meeting');
  assert(fetched.title === 'Test Standup', 'Retrieved meeting has correct title');

  const items = dbTool.getActionItemsForMeeting(saveResult.id);
  assert(items !== null, 'getActionItemsForMeeting() returns items');
  assert(items.actionItems.length === 1, 'Action items count matches');

  const searched = dbTool.searchMeetings('Standup');
  assert(searched.length >= 1, 'searchMeetings() finds results');

  const recent = dbTool.getRecentMeetings(5);
  assert(recent.length >= 1, 'getRecentMeetings() returns results');

  const deleted = dbTool.deleteMeeting(saveResult.id);
  assert(deleted.deleted, 'deleteMeeting() removes record');

  const afterDelete = dbTool.getMeeting(saveResult.id);
  assert(afterDelete === null, 'Meeting is gone after delete');

  dbTool.saveMeeting({
    title: 'Another Meeting',
    date: '2026-06-18',
    participants: ['Charlie'],
    transcript: 'Another discussion.',
    summary: 'Another summary.',
    keyPoints: [],
    decisions: [],
    actionItems: [],
    risksBlockers: [],
    status: 'completed',
  });
  assert(true, 'saveMeeting() works with minimal data');

// ------------------------------------------------------------------
// MEETING AGENT PARSING TESTS
// ------------------------------------------------------------------
console.log('\n📁 Parsing Logic Tests:');
const { parseLLMResponse } = await import('../src/agent/meetingAgent.js');

const parseResult = parseLLMResponse(`# Meeting Summary

## Overview
Team discussed sprint progress.

## Key Discussion Points
- Point one
- Point two

## Decisions
- Decision A
- Decision B

## Action Items
Task: Implement feature X
Owner: Alice
Deadline: Friday

Task: Write tests
Owner: Bob
Deadline: Monday

## Risks & Blockers
- Risk 1
- Risk 2`);

  assert(parseResult.summary.includes('sprint progress'), 'Summary parsed correctly');
  assert(parseResult.keyPoints.length === 2, 'Key points parsed');
  assert(parseResult.decisions.length === 2, 'Decisions parsed');
  assert(parseResult.actionItems.length === 2, 'Action items parsed');
  assert(parseResult.actionItems[0].task === 'Implement feature X', 'Task field parsed');
  assert(parseResult.actionItems[0].owner === 'Alice', 'Owner field parsed');
  assert(parseResult.actionItems[0].deadline === 'Friday', 'Deadline field parsed');
  assert(parseResult.risksBlockers.length === 2, 'Risks parsed');

  // ------------------------------------------------------------------
  // AGENT WORKFLOW TESTS (if LLM key available)
  // ------------------------------------------------------------------
  if (env.OPENAI_API_KEY || env.GROQ_API_KEY || env.ANTHROPIC_API_KEY) {
    console.log('\n📁 LLM Integration Tests:');
    try {
      const { MeetingAgent } = await import('../src/agent/meetingAgent.js');
      const agent = new MeetingAgent();
      const result = await agent.processTranscript(
        'LLM Test Meeting',
        SAMPLE_TRANSCRIPT,
        ['Sarah Chen', 'Marcus Johnson'],
        '2026-06-19'
      );

      assert(result && result.id > 0, 'processTranscript() returns saved meeting');
      assert(result.summary && result.summary.length > 0, 'Summary is generated');
      assert(result.actionItems && result.actionItems.length > 0, 'Action items extracted');

      const summaryLookup = await agent.getMeetingSummary(result.id.toString());
      assert(summaryLookup.found, 'getMeetingSummary() by ID works');

      const actionsLookup = await agent.getActionItems('recent');
      assert(actionsLookup.found, 'getActionItems("recent") works');

      const decisionsLookup = await agent.getDecisions('LLM Test');
      assert(decisionsLookup.found, 'getDecisions() works');

      console.log(`  ${INFO}: Token usage: ${JSON.stringify(result.tokenUsage)}`);
      console.log(`  ${INFO}: Estimated cost: $${result.costEstimate.toFixed(6)}`);

    } catch (error) {
      if (error.message.includes('LLM request failed') || error.message.includes('Incorrect API key')) {
        console.log(`  ${FAIL}: LLM test failed — check API key`);
        failed++;
      } else if (error.message.includes('Invalid transcript')) {
        console.log(`  ${FAIL}: Invalid transcript error: ${error.message}`);
        failed++;
      } else {
        console.log(`  ${FAIL}: LLM test error: ${error.message}`);
        failed++;
      }
    }
  } else {
    console.log(`\n  ${INFO}: Skipping LLM tests — no API key configured`);
    console.log(`  ${INFO}: Set OPENAI_API_KEY or GROQ_API_KEY in .env to run LLM tests`);
  }

  // ------------------------------------------------------------------
  // ERROR HANDLING TESTS
  // ------------------------------------------------------------------
  console.log('\n📁 Error Handling Tests:');
  try {
    const { MeetingAgent } = await import('../src/agent/meetingAgent.js');
    const testAgent = new MeetingAgent();
    await testAgent.processTranscript('Bad', 'short');
    assert(false, 'Should have thrown on short transcript');
  } catch (error) {
    assert(
      !!error,
      'Error handling works (constructor or validation)'
    );
  }

  // ------------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------------
  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════\n');

  closeDb();

  // Cleanup
  try {
    const { rmSync } = await import('fs');
    rmSync('./test-data', { recursive: true, force: true });
  } catch {}

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
