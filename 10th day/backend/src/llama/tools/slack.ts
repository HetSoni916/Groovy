import { FunctionTool } from 'llamaindex';

async function sendSlackMessage(message: string, webhookUrl?: string): Promise<string> {
  const url = webhookUrl || process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    return 'Error: No Slack webhook URL configured. Set SLACK_WEBHOOK_URL in .env or pass webhook_url parameter.';
  }
  if (!message.trim()) {
    return 'Error: Message cannot be empty';
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
    if (!res.ok) {
      const body = await res.text();
      return `Error: Slack returned status ${res.status}: ${body}`;
    }
    const preview = message.length > 50 ? message.substring(0, 50) + '...' : message;
    return `Successfully sent message to Slack: "${preview}"`;
  } catch (err: any) {
    return `Error sending Slack message: ${err.message}`;
  }
}

async function slackFn({ message, webhook_url }: { message: string; webhook_url?: string }): Promise<string> {
  return await sendSlackMessage(message, webhook_url);
}

export const slackTool = new FunctionTool(slackFn, {
  name: 'send_slack_message',
  description: 'Send a text message to a Slack channel via an incoming webhook URL.',
  parameters: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The message text to send to Slack',
      },
      webhook_url: {
        type: 'string',
        description: 'Optional: override the default Slack webhook URL from .env',
      },
    },
    required: ['message'],
  },
});
