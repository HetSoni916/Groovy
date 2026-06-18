import { AgentMessage, TokenUsage, AgentIteration } from './types';

export class SDKLogger {
  private sessionId: string;

  constructor() {
    this.sessionId = new Date().toISOString().replace(/[:.]/g, '-');
  }

  private timestamp(): string {
    return new Date().toISOString();
  }

  private log(level: string, tag: string, msg: string, data?: any) {
    const line = `[${this.timestamp()}] [${level}] [${tag}] ${msg}`;
    if (data) {
      console.log(line, JSON.stringify(data, null, 2));
    } else {
      console.log(line);
    }
  }

  userQuery(query: string) {
    this.log('INFO', 'USER', `Query: "${query.substring(0, 200)}"`, { length: query.length });
  }

  iterationStart(i: number, messageCount: number) {
    this.log('INFO', 'AGENT', `Iteration ${i} starting (${messageCount} messages in history)`);
  }

  llmRequest(model: string, toolCount: number) {
    this.log('INFO', 'LLM', `Request to ${model} with ${toolCount} tools defined`);
  }

  llmResponse(tokenUsage?: { input: number; output: number }) {
    if (tokenUsage) {
      this.log('INFO', 'LLM', `Response received`, tokenUsage);
    } else {
      this.log('INFO', 'LLM', `Response received`);
    }
  }

  toolCallGenerated(name: string, args: any) {
    this.log('INFO', 'TOOL_CALL', `LLM requested tool: ${name}`, { args });
  }

  toolResult(name: string, output: string) {
    const preview = output.length > 300 ? output.substring(0, 300) + '...' : output;
    this.log('INFO', 'TOOL_RESULT', `Tool ${name} returned`, { output: preview });
  }

  toolError(name: string, error: string) {
    this.log('ERROR', 'TOOL_ERR', `Tool ${name} failed: ${error}`);
  }

  finalAnswer(answer: string) {
    this.log('INFO', 'FINAL', `Answer (${answer.length} chars)`, { preview: answer.substring(0, 200) });
  }

  tokenUsage(usage: TokenUsage) {
    this.log('INFO', 'TOKENS', `Total: ${usage.total} (${usage.input} in / ${usage.output} out)`);
  }

  latency(ms: number) {
    this.log('INFO', 'LATENCY', `Total: ${ms}ms`);
  }

  error(context: string, err: any) {
    this.log('ERROR', 'ERROR', `${context}: ${err.message || err}`, { stack: err?.stack });
  }

  warn(msg: string) {
    this.log('WARN', 'WARN', msg);
  }

  iterationDetail(iter: AgentIteration) {
    this.log('DEBUG', 'ITER', `Iteration ${iter.iteration}`, {
      thought: iter.thought?.substring(0, 200),
      toolCall: iter.toolCall?.function.name,
      toolResult: iter.toolResult?.substring(0, 100),
      finalAnswer: iter.finalAnswer?.substring(0, 100),
    });
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

export const sdkLogger = new SDKLogger();
