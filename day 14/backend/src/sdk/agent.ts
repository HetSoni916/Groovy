import { agentConfig } from './config';
import { sdkLogger } from './logger';
import { ConversationManager } from './conversation';
import { toolSchemas } from './schemas';
import { llmCall } from './llm';
import { executeTool } from './executor';
import { AgentMessage, AgentRunResult, AgentIteration, TokenUsage } from './types';

const SYSTEM_PROMPT = `You are a helpful AI assistant with access to the following tools:

1. **calculator** - Mathematical calculations (add, subtract, multiply, divide, power, sqrt, modulo)
2. **web_search** - Search the web for current information, news, and real-time data
3. **send_slack_message** - Send messages to a Slack channel via webhook
4. **ask_my_notes** - Search the user's uploaded PDF documents for information

When you need to use a tool, use the function calling interface. You will receive the tool result in the next message.

For multi-step tasks: think step by step, use one tool at a time, observe the result, and decide the next action.
- When searching the web, cite sources.
- When answering from notes, include source page citations.
- If a tool returns an error, try an alternative approach or inform the user.

Always provide clear, well-formatted answers using markdown.`;

function extractToolCalls(msg: AgentMessage): Array<{ id: string; name: string; args: any }> | null {
  if (msg.tool_calls && msg.tool_calls.length > 0) {
    return msg.tool_calls.map(tc => ({
      id: tc.id,
      name: tc.function.name,
      args: JSON.parse(tc.function.arguments),
    }));
  }
  return null;
}

export async function runAgent(
  input: string,
  chatHistory?: { role: string; content: string }[]
): Promise<AgentRunResult> {
  const startTime = Date.now();
  const conversation = new ConversationManager(SYSTEM_PROMPT);
  const iterations: AgentIteration[] = [];
  const totalUsage: TokenUsage = { input: 0, output: 0, total: 0 };

  sdkLogger.userQuery(input);

  if (chatHistory && chatHistory.length > 0) {
    for (const msg of chatHistory) {
      if (msg.role === 'user') {
        conversation.addUserMessage(msg.content);
      } else if (msg.role === 'assistant') {
        conversation.addAssistantMessage(msg.content);
      }
    }
  }

  conversation.addUserMessage(input);

  let finalAnswer = '';
  let iterationCount = 0;

  while (iterationCount < agentConfig.maxIterations) {
    iterationCount++;
    sdkLogger.iterationStart(iterationCount, conversation.getMessageCount());

    const messages = conversation.getMessages();

    const llmResponse = await llmCall(messages, toolSchemas);

    const stepUsage = {
      input: llmResponse.usage?.prompt_tokens || 0,
      output: llmResponse.usage?.completion_tokens || 0,
      total: llmResponse.usage?.total_tokens || 0,
    };
    totalUsage.input += stepUsage.input;
    totalUsage.output += stepUsage.output;
    totalUsage.total += stepUsage.total;

    if (llmResponse.tool_calls && llmResponse.tool_calls.length > 0) {
      conversation.addAssistantMessage(llmResponse.content, llmResponse.tool_calls);

      for (const toolCall of llmResponse.tool_calls) {
        const iter: AgentIteration = {
          iteration: iterationCount,
          toolCall,
        };
        iterations.push(iter);

        const result = await executeTool(toolCall);
        iter.toolResult = result;

        conversation.addToolResult(toolCall.id, toolCall.function.name, result);
      }

      sdkLogger.iterationDetail(iterations[iterations.length - 1]);
      continue;
    }

    if (llmResponse.content) {
      finalAnswer = llmResponse.content;
      iterations.push({
        iteration: iterationCount,
        finalAnswer,
      });

      conversation.addAssistantMessage(finalAnswer);
      sdkLogger.iterationDetail(iterations[iterations.length - 1]);
      break;
    }

    finalAnswer = 'Error: LLM returned empty response with no tool calls.';
    sdkLogger.error('AGENT', 'Empty LLM response');
    break;
  }

  if (!finalAnswer) {
    finalAnswer = 'Error: Agent reached maximum iterations without producing a final answer.';
  }

  sdkLogger.finalAnswer(finalAnswer);
  sdkLogger.tokenUsage(totalUsage);

  const totalLatencyMs = Date.now() - startTime;
  sdkLogger.latency(totalLatencyMs);

  return {
    answer: finalAnswer,
    iterations,
    tokenUsage: totalUsage,
    totalLatencyMs,
  };
}
