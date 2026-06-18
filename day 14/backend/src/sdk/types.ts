export interface ToolSchema {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolResult {
  tool_call_id: string;
  name: string;
  content: string;
}

export interface AgentConfig {
  llmProvider: 'groq' | 'ollama';
  groqApiKey: string;
  groqModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  temperature: number;
  maxTokens: number;
  maxIterations: number;
  verbose: boolean;
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

export interface AgentIteration {
  iteration: number;
  thought?: string;
  toolCall?: ToolCall;
  toolResult?: string;
  finalAnswer?: string;
}

export interface AgentRunResult {
  answer: string;
  iterations: AgentIteration[];
  tokenUsage: TokenUsage;
  totalLatencyMs: number;
}
