import { AgentMessage, ToolCall } from './types';

export class ConversationManager {
  private messages: AgentMessage[] = [];

  constructor(systemPrompt: string) {
    this.messages.push({ role: 'system', content: systemPrompt });
  }

  addUserMessage(content: string) {
    this.messages.push({ role: 'user', content });
  }

  addAssistantMessage(content: string | null, toolCalls?: ToolCall[]) {
    this.messages.push({
      role: 'assistant',
      content: content || '',
      tool_calls: toolCalls,
    });
  }

  addToolResult(toolCallId: string, name: string, content: string) {
    this.messages.push({
      role: 'tool',
      content,
      tool_call_id: toolCallId,
      name,
    });
  }

  getMessages(): AgentMessage[] {
    return this.messages;
  }

  getLastMessage(): AgentMessage | undefined {
    return this.messages[this.messages.length - 1];
  }

  getMessageCount(): number {
    return this.messages.length;
  }

  hasToolResponse(): boolean {
    return this.messages.some(m => m.role === 'tool');
  }

  reset(keepSystem = true) {
    if (keepSystem) {
      const system = this.messages.find(m => m.role === 'system');
      this.messages = system ? [system] : [];
    } else {
      this.messages = [];
    }
  }

  getHistory(): AgentMessage[] {
    return this.messages.filter(m => m.role !== 'system');
  }
}
