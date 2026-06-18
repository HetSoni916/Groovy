import { runAgentExecutor } from '../agent/executor';
import { agentLogger } from '../agent/logger';
import { calculatorTool } from '../tools/calculatorTool';
import { webSearchTool } from '../tools/webSearchTool';
import { slackTool } from '../tools/slackTool';
import { askMyNotesTool } from '../tools/askMyNotesTool';
import { DynamicStructuredTool } from 'langchain';

export const tools: DynamicStructuredTool[] = [
  calculatorTool,
  webSearchTool,
  slackTool,
  askMyNotesTool,
];

export async function runAgent(userInput: string, history: any[] = []): Promise<string> {
  try {
    const result = await runAgentExecutor(userInput, tools, history);
    return result;
  } catch (err: any) {
    agentLogger.logToolError('runAgent', err);
    return `Error: ${err.message}. Please try again.`;
  }
}
