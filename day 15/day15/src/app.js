import { createInterface } from 'readline';
import { MeetingAgent } from './agent/meetingAgent.js';
import { closeDb } from './database/connection.js';
import { log } from './logger.js';
import { env } from './config/env.js';

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
Sarah: Priya, can you start looking into Apollo Client for the frontend integration?
Priya: Yes, I'll start researching today.
Alex: One thing — if we're going GraphQL, we need to think about caching strategy. The Redis work I'm doing now could support both rate limiting and GraphQL caching.
Sarah: Great idea. Alex, include GraphQL caching in your Redis setup. Let's align on this on Thursday.
Marcus: I have a concern — the GraphQL learning curve for the newer engineers. We should budget time for a knowledge-sharing session.
Sarah: Noted. I'll schedule a lunch-and-learn for next Tuesday. Anyone else have blockers?
Priya: I'm blocked on the notification service — I need the endpoint specs from the backend team.
Marcus: I'll prioritize those specs. You'll have them by end of day.
Sarah: Perfect. Let's wrap up. Key deadlines: Redis cluster by Friday, architecture doc by Wednesday, PR review today, notification specs today.`;

const SAMPLE_TRANSCRIPT_2 = `API Architecture Review — June 18, 2026

Participants: Sarah Chen, Marcus Johnson, Priya Patel, Alex Kim, David Park (Product)

David: We need a decision on the new customer portal's API approach by Friday. The design team is waiting on the data layer to finalize the UI mockups.
Sarah: Let's hear the options. Marcus, you've been researching this.
Marcus: Right. We've got three options: REST with versioning, GraphQL, or gRPC. For our use case — a customer-facing portal with complex data relationships — I strongly recommend GraphQL.
Priya: I agree. The portal has a dashboard with widgets that each need different data. With GraphQL, I can query exactly what each widget needs in one request. With REST, I'd need 5-6 endpoints per page load.
Alex: From an infrastructure perspective, GraphQL means we can consolidate our API gateway. Fewer endpoints to secure and monitor. But we'll need a solid caching layer.
David: What about the timeline? Can we deliver on schedule with GraphQL?
Marcus: Yes. There's a slight learning curve, but the development speed once we're past that is actually faster than REST.
Sarah: Let's make the call. We'll go with GraphQL for the new customer portal. Marcus will draft the architecture document by Wednesday. Alex will include GraphQL caching in his Redis setup. Priya will research Apollo Client.
David: Excellent. I'll communicate this to the design team.
Marcus: I want to flag a risk — the new engineers on the team haven't worked with GraphQL before. We need to allocate time for training.
Sarah: Good point. I'll schedule a knowledge-sharing session for next Tuesday.
Decision: Move forward with GraphQL for the new customer portal API.`;

function printHeader() {
  console.clear();
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║      Groovy AI Meeting Summary Agent v1.0          ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`LLM Provider: ${env.LLM_PROVIDER} | Model: ${env.OPENAI_MODEL || env.GROQ_MODEL || env.ANTHROPIC_MODEL}`);
  console.log(`Slack: ${env.SLACK_WEBHOOK_URL ? '✓ Configured' : '✗ Not configured'}`);
  console.log('');
}

function printHelp() {
  console.log('');
  console.log('Available commands:');
  console.log('  process <title>     — Process a hardcoded sample transcript');
  console.log('  summary <query>     — Retrieve a meeting summary');
  console.log('  actions <query>     — Get action items');
  console.log('  decisions <query>   — Get decisions from a meeting');
  console.log('  slack <id>          — Send meeting summary to Slack');
  console.log('  slack-actions <q>   — Send action items to Slack');
  console.log('  list                — List recent meetings');
  console.log('  help                — Show this help');
  console.log('  quit                — Exit');
  console.log('');
}

function formatActionItems(items) {
  return items.map(m => {
    let output = `\n📋 ${m.meetingTitle} (${m.meetingDate}):\n`;
    m.actionItems.forEach((a, i) => {
      output += `  ${i + 1}. ${a.task}\n`;
      output += `     👤 Owner: ${a.owner}\n`;
      output += `     📅 Deadline: ${a.deadline}\n`;
    });
    return output;
  }).join('\n');
}

async function main() {
  printHeader();

  let agent;
  try {
    agent = new MeetingAgent();
    log('APP', 'Meeting Agent initialized successfully');
  } catch (error) {
    log('APP', `Failed to initialize agent: ${error.message}`, 'ERROR');
    console.error(`\n❌ Initialization failed: ${error.message}`);
    console.log('\nMake sure your .env file is configured. Copy .env.example to .env and fill in the values.');
    process.exit(1);
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'groovy-agent> ',
  });

  printHelp();
  rl.prompt();

  rl.on('line', async (rawInput) => {
    const input = rawInput.trim();
    const args = input.split(' ');
    const command = args[0].toLowerCase();

    try {
      switch (command) {
        case 'process': {
          const title = args.slice(1).join(' ') || 'Engineering Standup';
          console.log(`\n⏳ Processing meeting: "${title}"...\n`);

          const transcript = title.includes('Architecture') ? SAMPLE_TRANSCRIPT_2 : SAMPLE_TRANSCRIPT;
          const participants = ['Sarah Chen', 'Marcus Johnson', 'Priya Patel', 'Alex Kim'];

          const result = await agent.processTranscript(title, transcript, participants);
          console.log(`\n✅ Meeting #${result.id} processed successfully!`);
          console.log(`\n${result.summary}\n`);
          console.log(`💰 Cost: $${result.costEstimate.toFixed(6)}`);
          break;
        }

        case 'summary': {
          const query = args.slice(1).join(' ') || 'yesterday';
          console.log(`\n🔍 Searching for: "${query}"...\n`);
          const result = await agent.getMeetingSummary(query);

          if (!result.found) {
            console.log(`\n${result.message}\n`);
          } else {
            const m = result.meeting;
            console.log(`\n📄 Meeting #${m.id}: ${m.title} (${m.date})`);
            console.log(`👥 Participants: ${m.participants.join(', ')}`);
            console.log(`\n${m.summary}\n`);

            if (m.keyPoints.length > 0) {
              console.log('Key Discussion Points:');
              m.keyPoints.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
              console.log('');
            }

            if (m.decisions.length > 0) {
              console.log('Decisions:');
              m.decisions.forEach(d => console.log(`  • ${d}`));
              console.log('');
            }

            if (m.actionItems.length > 0) {
              console.log('Action Items:');
              console.log(formatActionItems([{
                meetingTitle: m.title,
                meetingDate: m.date,
                actionItems: m.actionItems,
              }]));
            }
          }
          break;
        }

        case 'actions': {
          const query = args.slice(1).join(' ') || 'recent';
          console.log(`\n🔍 Searching action items: "${query}"...\n`);
          const result = await agent.getActionItems(query);

          if (!result.found) {
            console.log(`\n${result.message}\n`);
          } else {
            console.log(`✅ Found action items:`);
            console.log(formatActionItems(result.actionItems));
          }
          break;
        }

        case 'decisions': {
          const query = args.slice(1).join(' ') || 'API architecture';
          console.log(`\n🔍 Searching decisions: "${query}"...\n`);
          const result = await agent.getDecisions(query);

          if (!result.found) {
            console.log(`\n${result.message}\n`);
          } else {
            console.log('Decisions found:');
            result.meetings.forEach(m => {
              console.log(`\n📄 ${m.title} (${m.date}):`);
              m.decisions.forEach(d => console.log(`  • ${d}`));
            });
            console.log('');
          }
          break;
        }

        case 'slack': {
          const id = parseInt(args[1], 10);
          if (!id) { console.log('Usage: slack <meeting_id>'); break; }

          console.log(`\n⏳ Fetching meeting #${id} and sending to Slack...\n`);
          const meeting = agent.database.getMeeting(id);

          if (!meeting) {
            console.log(`❌ Meeting #${id} not found.`);
            break;
          }

          const result = await agent.sendToSlack(meeting);
          console.log(result.sent ? '✅ Meeting summary sent to Slack!' : '⚠️ Could not send to Slack.');
          break;
        }

        case 'slack-actions': {
          const query = args.slice(1).join(' ') || 'yesterday';
          console.log(`\n⏳ Sending action items for "${query}" to Slack...\n`);
          const result = await agent.sendActionItemsToSlack(query);
          console.log(result.sent ? `✅ ${result.message}` : `⚠️ ${result.message}`);
          break;
        }

        case 'list': {
          const limit = parseInt(args[1], 10) || 10;
          const meetings = agent.database.getRecentMeetings(limit);
          console.log(`\n📋 Recent Meetings (${meetings.length}):\n`);
          meetings.forEach(m => {
            console.log(`  #${String(m.id).padStart(3)} | ${m.date} | ${m.title}`);
          });
          console.log('');
          break;
        }

        case 'help':
          printHelp();
          break;

        case 'quit':
        case 'exit':
          console.log('\nGoodbye! 👋\n');
          closeDb();
          rl.close();
          process.exit(0);

        default:
          if (input) {
            console.log(`\n❓ Unknown command: "${command}". Type "help" for available commands.\n`);
          }
      }
    } catch (error) {
      console.error(`\n❌ Error: ${error.message}\n`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    closeDb();
    process.exit(0);
  });
}

main().catch((error) => {
  log('APP', `Fatal error: ${error.message}`, 'ERROR');
  console.error(`\n❌ Fatal error: ${error.message}`);
  process.exit(1);
});
