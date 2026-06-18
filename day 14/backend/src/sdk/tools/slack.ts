import { sdkLogger } from '../logger';

export async function runSlack(message: string, webhookUrl?: string): Promise<string> {
  sdkLogger.toolCallGenerated('send_slack_message', { message, webhook_url: webhookUrl });
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
    sdkLogger.toolError('send_slack_message', err.message);
    return `Error sending Slack message: ${err.message}`;
  }
}
