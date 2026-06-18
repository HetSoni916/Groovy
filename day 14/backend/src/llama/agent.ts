import { ReActAgent } from 'llamaindex';
import { Groq } from '@llamaindex/groq';
import { Ollama } from '@llamaindex/ollama';
import { llamaConfig } from './config';
import { llamaLogger } from './logger';
import { calculatorTool } from './tools/calculator';
import { webSearchTool } from './tools/webSearch';
import { slackTool } from './tools/slack';
import { askMyNotesTool } from './tools/askMyNotes';

const tools = [calculatorTool, webSearchTool, slackTool, askMyNotesTool];

const SYSTEM_PROMPT = `You are a helpful AI assistant with access to the following tools:

1. **calculator** - Mathematical calculations (add, subtract, multiply, divide, power, sqrt, modulo)
2. **web_search** - Search the web for current information, news, and real-time data
3. **send_slack_message** - Send messages to a Slack channel via webhook
4. **ask_my_notes** - Search the user's uploaded PDF documents for information

For multi-step tasks, think step by step. You can use multiple tools in sequence to accomplish complex requests.
When using the calculator, provide clear step-by-step reasoning.
When searching the web, always cite the source of your information.
When responding about notes, include source page citations.
If a tool returns an error, try an alternative approach or inform the user.

Always provide clear, well-formatted answers. Use markdown for readability.`;

function createLLM() {
  const provider = llamaConfig.llmProvider === 'groq' ? 'groq' : 'ollama';
  llamaLogger.info('CONFIG', `Using LLM provider: ${provider}`, {
    groqModel: llamaConfig.groqModel,
    ollamaModel: llamaConfig.ollamaModel,
  });

  if (provider === 'groq') {
    if (!llamaConfig.groqApiKey) {
      throw new Error('GROQ_API_KEY is not set. Configure it in .env to use Groq.');
    }
    return new Groq({
      model: llamaConfig.groqModel,
      apiKey: llamaConfig.groqApiKey,
      temperature: llamaConfig.temperature,
      maxTokens: llamaConfig.maxTokens,
    });
  }

  return new Ollama({
    model: llamaConfig.ollamaModel,
    config: {
      host: llamaConfig.ollamaBaseUrl,
    },
    options: {
      temperature: llamaConfig.temperature,
      numPredict: llamaConfig.maxTokens,
    },
  });
}

let agentInstance: ReActAgent | null = null;

function getAgent(): ReActAgent {
  if (!agentInstance) {
    const llm = createLLM();
    agentInstance = new ReActAgent({
      tools,
      llm,
      systemPrompt: SYSTEM_PROMPT,
      verbose: llamaConfig.agentVerbose,
    });
    llamaLogger.info('AGENT', 'ReActAgent initialized', {
      tools: tools.map(t => t.metadata.name),
      verbose: llamaConfig.agentVerbose,
    });
  }
  return agentInstance;
}

import { memoryManager } from '../memory/memoryManager';

export async function runAgent(
  input: string,
  stream = false,
  chatHistory?: { role: string; content: string }[],
  options: { sessionId?: string; userId?: string } = {}
): Promise<string> {
  const sessionId = options.sessionId || 'default-session';
  const userId = options.userId || 'default-user';

  llamaLogger.logUserQuery(input);

  // Retrieve relevant memories and construct system prompt
  const updatedSystemPrompt = await memoryManager.getSystemPromptWithMemory(userId, input, SYSTEM_PROMPT);

  // Create unique agent per session to ensure unique system prompts, or reset instance
  const llm = createLLM();
  const agent = new ReActAgent({
    tools,
    llm,
    systemPrompt: updatedSystemPrompt,
    verbose: llamaConfig.agentVerbose,
  });

  // Get session short term history if not passed directly
  const loadedHistory = (chatHistory && chatHistory.length > 0)
    ? chatHistory
    : memoryManager.getShortTermHistory(sessionId);

  const history = loadedHistory.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  // Save the user's input message to short term memory
  memoryManager.saveShortTermMessage(sessionId, 'user', input);

  let answer = '';

  if (stream) {
    const response = await agent.chat({
      message: input,
      stream: true as const,
      chatHistory: history,
    });
    const chunks: string[] = [];
    for await (const chunk of response as unknown as AsyncIterable<{ delta: string }>) {
      const text = (chunk as any)?.response || (chunk as any)?.delta || '';
      if (text) chunks.push(text);
    }
    answer = chunks.join('');
  } else {
    const response = await agent.chat({
      message: input,
      chatHistory: history,
    });

    answer = typeof (response as any)?.response === 'string'
      ? (response as any).response
      : String(response);
  }

  // Save assistant's answer to short term memory
  memoryManager.saveShortTermMessage(sessionId, 'assistant', answer);

  llamaLogger.logFinalAnswer(answer);

  // Trigger fact extraction in background
  memoryManager.autoExtractAndSaveFact(userId, input, answer).catch(err => {
    console.error('[Memory] Background memory extraction failed (LlamaIndex):', err);
  });

  return answer;
}

export function resetAgent() {
  agentInstance = null;
  llamaLogger.info('AGENT', 'Agent instance reset');
}

export { tools };
