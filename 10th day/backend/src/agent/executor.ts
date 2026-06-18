import { DynamicStructuredTool } from 'langchain';
import { HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages';
import { createLangChainAgent } from './createAgent';
import { agentLogger } from './logger';
import { calculatorTool } from '../tools/calculatorTool';
import { webSearchTool } from '../tools/webSearchTool';
import { slackTool } from '../tools/slackTool';
import { askMyNotesTool } from '../tools/askMyNotesTool';

const defaultTools: DynamicStructuredTool[] = [
  calculatorTool,
  webSearchTool,
  slackTool,
  askMyNotesTool,
];

function convertHistory(history: any[]): any[] {
  return history.map(msg => {
    if (msg.role === 'user') return new HumanMessage(msg.content);
    if (msg.role === 'assistant') return new AIMessage(msg.content);
    if (msg.role === 'tool') return new ToolMessage({ content: msg.content, tool_call_id: msg.tool_call_id || '' });
    return msg;
  });
}

function extractAnswer(result: any): string {
  const messages = result.messages;
  if (!messages || messages.length === 0) return 'No response generated';
  const lastMsg = messages[messages.length - 1];
  if (lastMsg?.content) return lastMsg.content;
  if (lastMsg?.text) return lastMsg.text;
  return 'No response generated';
}

export async function runAgentExecutor(
  input: string,
  tools: DynamicStructuredTool[] = defaultTools,
  history: any[] = []
): Promise<string> {
  agentLogger.logUserQuery(input);

  const { agent, threadId } = createLangChainAgent(tools);

  const historyMessages = convertHistory(history);
  const messages = [
    ...historyMessages,
    new HumanMessage(input),
  ];

  try {
    const result = await agent.invoke(
      { messages },
      { configurable: { thread_id: threadId } }
    );

    const answer = extractAnswer(result);
    agentLogger.logFinalAnswer(answer);
    return answer;
  } catch (err: any) {
    agentLogger.logToolError('executor', err);
    throw err;
  }
}

export async function runAgentExecutorStream(
  input: string,
  onEvent: (event: any) => void,
  tools: DynamicStructuredTool[] = defaultTools,
  history: any[] = []
): Promise<string> {
  agentLogger.logUserQuery(input);

  const { agent, threadId } = createLangChainAgent(tools);

  const historyMessages = convertHistory(history);
  const messages = [
    ...historyMessages,
    new HumanMessage(input),
  ];

  try {
    const stream = await agent.stream(
      { messages },
      { configurable: { thread_id: threadId }, streamMode: 'values' }
    );

    let finalResult: any;
    for await (const chunk of stream) {
      finalResult = chunk;
      const lastMsg = chunk.messages?.[chunk.messages.length - 1];
      if (lastMsg && !(lastMsg instanceof ToolMessage)) {
        onEvent({ type: 'token', content: lastMsg.content });
      }
    }

    const answer = extractAnswer(finalResult);
    agentLogger.logFinalAnswer(answer);
    return answer;
  } catch (err: any) {
    agentLogger.logToolError('executor_stream', err);
    throw err;
  }
}
