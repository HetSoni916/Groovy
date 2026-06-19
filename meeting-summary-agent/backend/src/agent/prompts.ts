export const MEETING_SUMMARY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    overview: { type: 'string' },
    keyDiscussionPoints: { type: 'array', items: { type: 'string' } },
    decisions: { type: 'array', items: { type: 'string' } },
    actionItems: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          task: { type: 'string' },
          owner: { type: ['string', 'null'] },
          deadline: { type: ['string', 'null'] },
          status: { type: 'string', enum: ['open', 'in-progress', 'done', 'blocked'] },
        },
        required: ['task', 'owner', 'deadline', 'status'],
      },
    },
    risksOrBlockers: { type: 'array', items: { type: 'string' } },
    participants: { type: 'array', items: { type: 'string' } },
    deadlineWarnings: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'overview', 'keyDiscussionPoints', 'decisions', 'actionItems', 'risksOrBlockers', 'participants', 'deadlineWarnings'],
} as const;

export const QUERY_PLAN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    intent: { type: 'string', enum: ['search', 'summary', 'decisions', 'action_items'] },
    keywords: { type: 'array', items: { type: 'string' } },
    dateHint: { type: ['string', 'null'] },
    limit: { type: 'number', minimum: 1, maximum: 20 },
  },
  required: ['intent', 'keywords', 'dateHint', 'limit'],
} as const;

export function buildMeetingAnalysisPrompt(input: {
  transcript: string;
  title?: string;
  meetingDateTime?: string;
  participants?: string[];
}): string {
  return [
    'You are Groovy\'s internal meeting coordinator.',
    'Produce a concise, accurate structured meeting summary from the transcript.',
    'Never invent facts. If something is missing, use the most conservative wording possible and leave owner/deadline null when absent.',
    'Return only JSON that matches the provided schema.',
    '',
    `Meeting title hint: ${input.title ?? 'not provided'}`,
    `Meeting datetime hint: ${input.meetingDateTime ?? 'not provided'}`,
    `Participants hint: ${(input.participants ?? []).join(', ') || 'not provided'}`,
    '',
    'Transcript / notes:',
    input.transcript,
  ].join('\n');
}

export function buildQueryPlanPrompt(question: string): string {
  return [
    'You are classifying a meeting-history question for an internal operations assistant.',
    'Extract the best retrieval plan using only the user question.',
    'Choose the narrowest helpful intent, helpful keywords, any date hint, and a sensible result limit.',
    'Return only JSON that matches the schema.',
    '',
    `User question: ${question}`,
  ].join('\n');
}