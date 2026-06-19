import { env } from '../config/env';
import { MeetingRecord, SlackPayloadRequest } from '../types';
import { logger } from '../utils/logger';

function renderLines(meeting: MeetingRecord, mode: SlackPayloadRequest['mode']): string[] {
  if (mode === 'action_items') {
    return meeting.actionItems.length > 0
      ? meeting.actionItems.map((item) => `• ${item.task} | Owner: ${item.owner ?? 'Unassigned'} | Deadline: ${item.deadline ?? 'Missing'}`)
      : ['No action items were extracted from the transcript.'];
  }

  if (mode === 'decisions') {
    return meeting.decisions.length > 0
      ? meeting.decisions.map((decision) => `• ${decision}`)
      : ['No explicit decisions were captured.'];
  }

  return [
    `Overview: ${meeting.overview}`,
    '',
    'Action items:',
    ...(meeting.actionItems.length > 0
      ? meeting.actionItems.map((item) => `• ${item.task} | Owner: ${item.owner ?? 'Unassigned'} | Deadline: ${item.deadline ?? 'Missing'}`)
      : ['• No action items were extracted.']),
  ];
}

export async function sendSlackNotification(request: SlackPayloadRequest): Promise<void> {
  if (!env.SLACK_WEBHOOK_URL) {
    throw new Error('Slack webhook is not configured. Set SLACK_WEBHOOK_URL in the backend environment.');
  }

  const lines = renderLines(request.meeting, request.mode);
  const payload = {
    text: `Groovy Meeting Summary: ${request.meeting.title}`,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: `Groovy Meeting Summary: ${request.meeting.title}` } },
      { type: 'section', text: { type: 'mrkdwn', text: `*Date:* ${request.meeting.meetingDateTime}\n*Participants:* ${request.meeting.participants.join(', ') || 'Not provided'}` } },
      { type: 'section', text: { type: 'mrkdwn', text: lines.join('\n') } },
    ],
  };

  logger.info('slack.send.start', { meetingId: request.meeting.id, mode: request.mode });
  const response = await fetch(env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error('slack.send.failure', { status: response.status, body });
    throw new Error(`Slack webhook failed with status ${response.status}.`);
  }

  logger.info('slack.send.success', { meetingId: request.meeting.id, mode: request.mode });
}