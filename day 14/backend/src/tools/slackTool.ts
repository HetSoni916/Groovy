import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

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

export const slackTool = new DynamicStructuredTool({
  name: 'send_slack_message',
  description: 'Send a text message to a Slack channel via an incoming webhook URL.',
  schema: z.object({
    message: z.string().describe('The message text to send to Slack'),
    webhook_url: z.string().optional().describe('Optional: override the default Slack webhook URL from .env'),
  }),
  func: async ({ message, webhook_url }) => {
    return await sendSlackMessage(message, webhook_url);
  },
});
