import { ToolSchema } from './types';

export const toolSchemas: ToolSchema[] = [
  {
    name: 'calculator',
    description: 'Performs mathematical calculations. Supports add, subtract, multiply, divide, power, sqrt, modulo.',
    parameters: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt', 'modulo'],
          description: 'The math operation to perform',
        },
        a: {
          type: 'number',
          description: 'First number (or base for power, or the number for sqrt)',
        },
        b: {
          type: 'number',
          description: 'Second number (not needed for sqrt)',
        },
      },
      required: ['operation', 'a'],
    },
  },
  {
    name: 'web_search',
    description: 'Search the web for current information, news, facts, and real-time data. Use this for up-to-date information beyond general knowledge.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query (e.g., "latest AI news 2026")',
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of search results (1-10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'send_slack_message',
    description: 'Send a text message to a Slack channel via an incoming webhook URL.',
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The message text to send to Slack',
        },
        webhook_url: {
          type: 'string',
          description: 'Optional: override the default Slack webhook URL from .env',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'ask_my_notes',
    description: 'Search the user\'s uploaded PDF documents (notes) for information. Use this when the user asks about content from their own documents, uploaded PDFs, or notes. Returns answers with source page citations.',
    parameters: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'The question to search for in the uploaded notes/documents',
        },
        documentIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional: restrict search to specific document IDs',
        },
      },
      required: ['question'],
    },
  },
];
