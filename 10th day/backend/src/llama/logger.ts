type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  details?: any;
}

export class LlamaLogger {
  private logs: LogEntry[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = new Date().toISOString().replace(/[:.]/g, '-');
  }

  private log(level: LogLevel, category: string, message: string, details?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      details,
    };
    this.logs.push(entry);
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${category}]`;
    if (level === 'error') {
      console.error(`${prefix} ${message}`, details ? JSON.stringify(details, null, 2) : '');
    } else if (level === 'warn') {
      console.warn(`${prefix} ${message}`, details ? JSON.stringify(details, null, 2) : '');
    } else {
      console.log(`${prefix} ${message}`, details ? JSON.stringify(details, null, 2) : '');
    }
  }

  info(category: string, message: string, details?: any) {
    this.log('info', category, message, details);
  }

  warn(category: string, message: string, details?: any) {
    this.log('warn', category, message, details);
  }

  error(category: string, message: string, details?: any) {
    this.log('error', category, message, details);
  }

  debug(category: string, message: string, details?: any) {
    this.log('debug', category, message, details);
  }

  logUserQuery(query: string) {
    this.info('USER', `User query: "${query.substring(0, 200)}"`, { length: query.length });
  }

  logToolSelection(toolName: string, input: any) {
    this.info('TOOL', `Selected tool: ${toolName}`, { input });
  }

  logToolResult(toolName: string, output: any) {
    this.info('TOOL_RESULT', `Tool result from: ${toolName}`, { output: String(output).substring(0, 500) });
  }

  logToolError(toolName: string, error: any) {
    this.error('TOOL_ERROR', `Tool ${toolName} failed`, { error: String(error) });
  }

  logFinalAnswer(answer: string) {
    this.info('FINAL', `Final answer prepared (${answer.length} chars)`, { preview: answer.substring(0, 200) });
  }

  logTokenUsage(tokens: { input: number; output: number; total: number }) {
    this.info('TOKENS', `Token usage: ${tokens.total} (${tokens.input} in / ${tokens.output} out)`);
  }

  logCost(cost: number) {
    this.info('COST', `Estimated cost: $${cost.toFixed(6)}`);
  }

  logRetrievalResults(chunkCount: number, scores?: number[]) {
    this.info('RETRIEVAL', `Retrieved ${chunkCount} chunks from vector store`, scores ? { scores } : undefined);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

export const llamaLogger = new LlamaLogger();
