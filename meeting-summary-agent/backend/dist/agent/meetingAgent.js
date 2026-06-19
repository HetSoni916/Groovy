"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeMeeting = analyzeMeeting;
exports.answerMeetingQuestion = answerMeetingQuestion;
exports.sendMeetingSlackUpdate = sendMeetingSlackUpdate;
const zod_1 = require("zod");
const prompts_1 = require("./prompts");
const client_1 = require("../llm/client");
const databaseTool_1 = require("../tools/databaseTool");
const slackTool_1 = require("../tools/slackTool");
const logger_1 = require("../utils/logger");
const analysisValidator = zod_1.z.object({
    title: zod_1.z.string().min(1),
    overview: zod_1.z.string().min(1),
    keyDiscussionPoints: zod_1.z.array(zod_1.z.string()).default([]),
    decisions: zod_1.z.array(zod_1.z.string()).default([]),
    actionItems: zod_1.z.array(zod_1.z.object({
        task: zod_1.z.string().min(1),
        owner: zod_1.z.string().nullable(),
        deadline: zod_1.z.string().nullable(),
        status: zod_1.z.enum(['open', 'in-progress', 'done', 'blocked']),
    })).default([]),
    risksOrBlockers: zod_1.z.array(zod_1.z.string()).default([]),
    participants: zod_1.z.array(zod_1.z.string()).default([]),
    deadlineWarnings: zod_1.z.array(zod_1.z.string()).default([]),
});
const queryPlanValidator = zod_1.z.object({
    intent: zod_1.z.enum(['search', 'summary', 'decisions', 'action_items']),
    keywords: zod_1.z.array(zod_1.z.string()).default([]),
    dateHint: zod_1.z.string().nullable(),
    limit: zod_1.z.number().int().min(1).max(20),
});
function validateTranscript(transcript) {
    if (!transcript || transcript.trim().length < 20) {
        throw new Error('Invalid transcript. Please provide a transcript or meeting notes with at least a few sentences.');
    }
}
function normalizeMeetingDateTime(value) {
    if (value && !Number.isNaN(Date.parse(value))) {
        return new Date(value).toISOString();
    }
    return new Date().toISOString();
}
function buildSearchText(plan) {
    return [plan.keywords.join(' '), plan.dateHint ?? '', plan.intent.replace('_', ' ')].join(' ').trim();
}
function summarizeRecords(records, plan) {
    if (records.length === 0) {
        return 'No matching meeting records were found in the database.';
    }
    const topRecord = records[0];
    const lines = [];
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
function extractDateConstraints(dateHint) {
    if (!dateHint) {
        return null;
    }
    const normalized = dateHint.toLowerCase();
    const now = new Date();
    const floorToDay = (date) => {
        const value = new Date(date);
        value.setHours(0, 0, 0, 0);
        return value.toISOString();
    };
    const ceilToDay = (date) => {
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
async function analyzeMeeting(input) {
    validateTranscript(input.transcript);
    logger_1.logger.info('meeting.analyze.start', {
        title: input.title,
        transcriptLength: input.transcript.length,
        sendToSlack: Boolean(input.sendToSlack),
    });
    const { data, usage } = await (0, client_1.generateStructuredOutput)({
        name: 'meeting_summary',
        schema: prompts_1.MEETING_SUMMARY_SCHEMA,
        prompt: (0, prompts_1.buildMeetingAnalysisPrompt)({
            transcript: input.transcript,
            title: input.title,
            meetingDateTime: input.meetingDateTime,
            participants: input.participants,
        }),
    });
    const validated = analysisValidator.parse(data);
    const meeting = databaseTool_1.databaseTool.saveMeeting(validated, input.transcript, normalizeMeetingDateTime(input.meetingDateTime), input.status ?? 'completed');
    let slackSent = false;
    if (input.sendToSlack) {
        await (0, slackTool_1.sendSlackNotification)({ meeting, mode: input.slackMode ?? 'action_items' });
        slackSent = true;
    }
    logger_1.logger.info('meeting.analyze.complete', {
        meetingId: meeting.id,
        estimatedCost: usage.estimatedCost,
        slackSent,
    });
    return { meeting, usage, slackSent };
}
async function answerMeetingQuestion(request) {
    if (!request.question || request.question.trim().length < 5) {
        throw new Error('Please enter a more specific question.');
    }
    const { data: planData } = await (0, client_1.generateStructuredOutput)({
        name: 'meeting_query_plan',
        schema: prompts_1.QUERY_PLAN_SCHEMA,
        prompt: (0, prompts_1.buildQueryPlanPrompt)(request.question),
    });
    const queryPlan = queryPlanValidator.parse(planData);
    const dateRange = extractDateConstraints(queryPlan.dateHint);
    const searchText = buildSearchText(queryPlan) || request.question;
    let meetings = databaseTool_1.databaseTool.searchMeetings(searchText, queryPlan.limit);
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
    logger_1.logger.info('meeting.query.complete', {
        question: request.question,
        matches: meetings.length,
        intent: queryPlan.intent,
    });
    return { answer, queryPlan, meetings };
}
async function sendMeetingSlackUpdate(meetingId, mode) {
    const meeting = databaseTool_1.databaseTool.getMeetingById(meetingId);
    if (!meeting) {
        throw new Error('Meeting not found.');
    }
    await (0, slackTool_1.sendSlackNotification)({ meeting, mode });
    return meeting;
}
//# sourceMappingURL=meetingAgent.js.map