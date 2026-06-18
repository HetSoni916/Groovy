import Groq from 'groq-sdk';
import { agentConfig } from './config';
import { ToolSchema, AgentMessage, TokenUsage } from './types';
import { sdkLogger } from './logger';

interface LLMResponse {
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

async function callGroq(
  messages: AgentMessage[],
  tools: ToolSchema[]
): Promise<LLMResponse> {
  const groq = new Groq({ apiKey: agentConfig.groqApiKey });

  const body: any = {
    model: agentConfig.groqModel,
    messages: messages.map(m => {
      const msg: any = { role: m.role, content: m.content };
      if (m.tool_calls) msg.tool_calls = m.tool_calls;
      if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
      if (m.name) msg.name = m.name;
      return msg;
    }),
    temperature: agentConfig.temperature,
    max_tokens: agentConfig.maxTokens,
  };

  if (tools.length > 0) {
    body.tools = tools.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));
    body.tool_choice = 'auto';
  }

  const completion = await groq.chat.completions.create(body);
  const choice = completion.choices?.[0];

  if (!choice) {
    throw new Error('Empty response from Groq API');
  }

  const response: LLMResponse = {
    content: choice.message?.content || null,
    usage: completion.usage
      ? {
          prompt_tokens: completion.usage.prompt_tokens || 0,
          completion_tokens: completion.usage.completion_tokens || 0,
          total_tokens: completion.usage.total_tokens || 0,
        }
      : undefined,
  };

  if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
    response.tool_calls = choice.message.tool_calls.map((tc: any) => ({
      id: tc.id,
      type: 'function' as const,
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments,
      },
    }));
  }

  return response;
}

async function callOllama(
  messages: AgentMessage[],
  tools: ToolSchema[]
): Promise<LLMResponse> {
  const systemMsg = messages.find(m => m.role === 'system');
  const nonSystemMessages = messages.filter(m => m.role !== 'system');

  const toolDescriptions = tools.map(t => {
    const props = t.parameters.properties;
    const paramDocs = Object.entries(props)
      .map(([k, v]: any) => `  ${k} (${v.type}): ${v.description || ''}`)
      .join('\n');
    return `## ${t.name}\n${t.description}\nParameters:\n${paramDocs}`;
  }).join('\n\n');

  const systemPrompt = systemMsg
    ? `${systemMsg.content}\n\nYou have access to the following tools. If you need to use a tool, respond with EXACTLY a JSON object in this format WITHOUT any other text:\n\n{"tool": "<tool_name>", "args": {<arg1>: <value1>, ...}}\n\nAvailable tools:\n${toolDescriptions}\n\nIf you do not need a tool, respond normally with text.`
    : `You have access to the following tools. If you need to use a tool, respond with EXACTLY a JSON object in this format WITHOUT any other text:\n\n{"tool": "<tool_name>", "args": {<arg1>: <value1>, ...}}\n\nAvailable tools:\n${toolDescriptions}\n\nIf you do not need a tool, respond normally with text.`;

  const body = JSON.stringify({
    model: agentConfig.ollamaModel,
    messages: [
      { role: 'system', content: systemPrompt },
      ...nonSystemMessages.map(m => {
        const msg: any = { role: m.role, content: m.content };
        if (m.tool_calls) msg.tool_calls = m.tool_calls;
        if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
        if (m.name) msg.name = m.name;
        return msg;
      }),
    ],
    stream: false,
    options: { temperature: agentConfig.temperature, num_predict: agentConfig.maxTokens },
  });

  const res = await fetch(`${agentConfig.ollamaBaseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(`Ollama error (${res.status}): ${bodyText}`);
  }

  const data: any = await res.json();
  const content = data.message?.content || '';

  const toolMatch = content.match(/\{\s*"tool"\s*:\s*"([^"]+)"\s*,\s*"args"\s*:\s*(\{.*?\})\s*\}/s);
  if (toolMatch) {
    const toolName = toolMatch[1];
    try {
      const args = JSON.parse(toolMatch[2]);
      return {
        content: null,
        tool_calls: [{
          id: `call_${Date.now()}`,
          type: 'function' as const,
          function: { name: toolName, arguments: JSON.stringify(args) },
        }],
      };
    } catch {
      return { content, tool_calls: undefined };
    }
  }

  return { content, tool_calls: undefined };
}

export async function llmCall(
  messages: AgentMessage[],
  tools: ToolSchema[]
): Promise<LLMResponse> {
  sdkLogger.llmRequest(
    agentConfig.llmProvider === 'groq' ? agentConfig.groqModel : agentConfig.ollamaModel,
    tools.length
  );

  const provider = agentConfig.llmProvider;

  if (provider === 'groq') {
    if (!agentConfig.groqApiKey) throw new Error('GROQ_API_KEY not configured');
    return await callGroq(messages, tools);
  }

  return await callOllama(messages, tools);
}
