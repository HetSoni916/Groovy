import { z } from 'zod';
import { buildMeetingAnalysisPrompt, buildQueryPlanPrompt, MEETING_SUMMARY_SCHEMA, QUERY_PLAN_SCHEMA } from './prompts';
import { generateStructuredOutput } from '../llm/client';
import { databaseTool } from '../tools/databaseTool';
import { sendSlackNotification } from '../tools/slackTool';
import { AnalyzeMeetingRequest, MeetingAnalysis, MeetingRecord, QueryPlan, QueryRequest, SlackShareMode } from '../types';
import { logger } from '../utils/logger';

const analysisValidator = z.object({
  title: z.string().min(1),
  overview: z.string().min(1),
  keyDiscussionPoints: z.array(z.string()).default([]),
  decisions: z.array(z.string()).default([]),
  actionItems: z.array(z.object({
    task: z.string().min(1),
    owner: z.string().nullable(),
    deadline: z.string().nullable(),
    status: z.enum(['open', 'in-progress', 'done', 'blocked']),
  })).default([]),
  risksOrBlockers: z.array(z.string()).default([]),
  participants: z.array(z.string()).default([]),
  deadlineWarnings: z.array(z.string()).default([]),
});

const queryPlanValidator = z.object({
  intent: z.enum(['search', 'summary', 'decisions', 'action_items']),
  keywords: z.array(z.string()).default([]),
  dateHint: z.string().nullable(),
  limit: z.number().int().min(1).max(20),
});

function validateTranscript(transcript: string): void {
  if (!transcript || transcript.trim().length < 20) {
    throw new Error('Invalid transcript. Please provide a transcript or meeting notes with at least a few sentences.');
  }
}

function normalizeMeetingDateTime(value?: string): string {
  if (value && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  return new Date().toISOString();
}

function buildSearchText(plan: QueryPlan): string {
  return [plan.keywords.join(' '), plan.dateHint ?? '', plan.intent.replace('_', ' ')].join(' ').trim();
}

function summarizeRecords(records: MeetingRecord[], plan: QueryPlan): string {
  if (records.length === 0) {
    return 'No matching meeting records were found in the database.';
  }

  const topRecord = records[0];
  const lines: string[] = [];
  lines.push(`Found ${records.length} meeting record${records.length === 1 ? '' : 's'}.`);
  lines.push('');

  for (const record of records.slice(0, 3)) {
    lines.push(`# ${record.title}`);
    lines.push(`Date: ${record.meetingDateTime}`);
    lines.push(`Participants: ${record.participants.join(', ') || 'Not provided'}`);

    if (plan.intent === 'summary') {
      lines.push(`Summary: ${record.overview}`);
    }

    if (plan.intent === 'decisions' || plan.intent === 'search') {
      lines.push('Decisions:');
      lines.push(record.decisions.length > 0 ? record.decisions.map((decision) => `- ${decision}`).join('\n') : '- No explicit decisions recorded.');
    }

    if (plan.intent === 'action_items' || plan.intent === 'search') {
      lines.push('Action items:');
      lines.push(record.actionItems.length > 0
        ? record.actionItems.map((item) => `- ${item.task} | Owner: ${item.owner ?? 'Unassigned'} | Deadline: ${item.deadline ?? 'Missing'}`).join('\n')
        : '- No action items recorded.');
    }

    lines.push('');
  }

  if (plan.intent === 'summary') {
    lines.unshift(`Most relevant summary: ${topRecord.overview}`);
  }

  return lines.join('\n');
}

function extractDateConstraints(dateHint: string | null): { start?: string; end?: string } | null {
  if (!dateHint) {
    return null;
  }

  const normalized = dateHint.toLowerCase();
  const now = new Date();

  const floorToDay = (date: Date): string => {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value.toISOString();
  };

  const ceilToDay = (date: Date): string => {
    const value = new Date(date);
    value.setHours(23, 59, 59, 999);
    return value.toISOString();
  };

  if (normalized.includes('yesterday')) {
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    return { start: floorToDay(start), end: ceilToDay(start) };
  }

  if (normalized.includes('today')) {
    return { start: floorToDay(now), end: ceilToDay(now) };
  }

  if (normalized.includes('last week')) {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { start: floorToDay(start), end: ceilToDay(now) };
  }

  const parsed = Date.parse(dateHint);
  if (!Number.isNaN(parsed)) {
    const date = new Date(parsed);
    return { start: floorToDay(date), end: ceilToDay(date) };
  }

  return null;
}

export async function analyzeMeeting(input: AnalyzeMeetingRequest): Promise<{
  meeting: MeetingRecord;
  usage: { inputTokens: number; outputTokens: number; estimatedCost: number };
  slackSent: boolean;
}> {
  validateTranscript(input.transcript);

  logger.info('meeting.analyze.start', {
    title: input.title,
    transcriptLength: input.transcript.length,
    sendToSlack: Boolean(input.sendToSlack),
  });

  const { data, usage } = await generateStructuredOutput<MeetingAnalysis>({
    name: 'meeting_summary',
    schema: MEETING_SUMMARY_SCHEMA,
    prompt: buildMeetingAnalysisPrompt({
      transcript: input.transcript,
      title: input.title,
      meetingDateTime: input.meetingDateTime,
      participants: input.participants,
    }),
  });

  const validated = analysisValidator.parse(data);
  const meeting = databaseTool.saveMeeting(
    validated,
    input.transcript,
    normalizeMeetingDateTime(input.meetingDateTime),
    input.status ?? 'completed'
  );

  let slackSent = false;
  if (input.sendToSlack) {
    await sendSlackNotification({ meeting, mode: input.slackMode ?? 'action_items' });
    slackSent = true;
  }

  logger.info('meeting.analyze.complete', {
    meetingId: meeting.id,
    estimatedCost: usage.estimatedCost,
    slackSent,
  });

  return { meeting, usage, slackSent };
}

export async function answerMeetingQuestion(request: QueryRequest): Promise<{
  answer: string;
  queryPlan: QueryPlan;
  meetings: MeetingRecord[];
}> {
  if (!request.question || request.question.trim().length < 5) {
    throw new Error('Please enter a more specific question.');
  }

  const { data: planData } = await generateStructuredOutput<QueryPlan>({
    name: 'meeting_query_plan',
    schema: QUERY_PLAN_SCHEMA,
    prompt: buildQueryPlanPrompt(request.question),
  });

  const queryPlan = queryPlanValidator.parse(planData);
  const dateRange = extractDateConstraints(queryPlan.dateHint);
  const searchText = buildSearchText(queryPlan) || request.question;
  let meetings = databaseTool.searchMeetings(searchText, queryPlan.limit);

  if (dateRange) {
    meetings = meetings.filter((meeting) => {
      const timestamp = Date.parse(meeting.meetingDateTime);
      if (Number.isNaN(timestamp)) {
        return true;
      }
      const start = dateRange.start ? Date.parse(dateRange.start) : Number.NEGATIVE_INFINITY;
      const end = dateRange.end ? Date.parse(dateRange.end) : Number.POSITIVE_INFINITY;
      return timestamp >= start && timestamp <= end;
    });
  }

  const answer = summarizeRecords(meetings, queryPlan);
  logger.info('meeting.query.complete', {
    question: request.question,
    matches: meetings.length,
    intent: queryPlan.intent,
  });

  return { answer, queryPlan, meetings };
}

export async function sendMeetingSlackUpdate(meetingId: string, mode: SlackShareMode): Promise<MeetingRecord> {
  const meeting = databaseTool.getMeetingById(meetingId);
  if (!meeting) {
    throw new Error('Meeting not found.');
  }

  await sendSlackNotification({ meeting, mode });
  return meeting;
}