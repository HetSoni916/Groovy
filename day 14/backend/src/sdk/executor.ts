import { ToolCall } from './types';
import { runCalculator } from './tools/calculator';
import { runWebSearch } from './tools/webSearch';
import { runSlack } from './tools/slack';
import { askMyNotes } from './tools/askMyNotes';
import { sdkLogger } from './logger';

export async function executeTool(toolCall: ToolCall): Promise<string> {
  const { name, arguments: argsStr } = toolCall.function;
  let args: any;

  try {
    args = JSON.parse(argsStr);
  } catch {
    const err = `Invalid JSON arguments for tool "${name}": ${argsStr}`;
    sdkLogger.toolError(name, err);
    return `Error: ${err}`;
  }

  sdkLogger.toolCallGenerated(name, args);

  try {
    let result: string;

    switch (name) {
      case 'calculator':
        result = await runCalculator(args.operation, args.a, args.b);
        break;
      case 'web_search':
        result = await runWebSearch(args.query, args.max_results);
        break;
      case 'send_slack_message':
        result = await runSlack(args.message, args.webhook_url);
        break;
      case 'ask_my_notes':
        result = await askMyNotes(args.question, args.documentIds);
        break;
      default:
        result = `Error: Unknown tool "${name}". Available tools: calculator, web_search, send_slack_message, ask_my_notes`;
    }

    sdkLogger.toolResult(name, result);
    return result;
  } catch (err: any) {
    const errMsg = `Error executing ${name}: ${err.message}`;
    sdkLogger.toolError(name, err.message);
    return errMsg;
  }
}
