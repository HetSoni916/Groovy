import { LLMClient } from '../llm/client.js';
import { DatabaseTool } from '../tools/databaseTool.js';
import { SlackTool } from '../tools/slackTool.js';
import { SYSTEM_PROMPT } from './prompts.js';
import { log } from '../logger.js';

export class MeetingAgent {
  constructor() {
    this._llm = null;
    this.database = new DatabaseTool();
    this.slack = new SlackTool();
  }

  get llm() {
    if (!this._llm) {
      this._llm = new LLMClient();
    }
    return this._llm;
  }

  async processTranscript(title, transcript, participants = [], date = null) {
    log('AGENT', `Processing transcript: "${title}"`);

    if (!transcript || transcript.trim().length < 20) {
      throw new Error('Invalid transcript: Transcript is too short or empty. Please provide a longer meeting transcript.');
    }

    const meetingDate = date || new Date().toISOString().split('T')[0];

    log('AGENT', 'Sending transcript to LLM for analysis...');
    const llmResponse = await this.llm.chat(SYSTEM_PROMPT, transcript);

    const parsed = this._parseLLMResponse(llmResponse.content);

    const meetingData = {
      title,
      date: meetingDate,
      participants,
      transcript,
      summary: parsed.summary,
      keyPoints: parsed.keyPoints,
      decisions: parsed.decisions,
      actionItems: parsed.actionItems,
      risksBlockers: parsed.risksBlockers,
      status: 'completed',
      tokenUsage: llmResponse.usage,
      costEstimate: llmResponse.usage.costEstimate,
    };

    log('AGENT', 'Saving to database...');
    const saved = this.database.saveMeeting(meetingData);

    log('AGENT', `Meeting processed and saved (ID: ${saved.id}) | Cost: $${llmResponse.usage.costEstimate.toFixed(6)}`);

    return {
      id: saved.id,
      ...meetingData,
    };
  }

  async getMeetingSummary(query) {
    log('AGENT', `Retrieving meeting: "${query}"`);

    let meeting = null;

    if (/^\d+$/.test(query)) {
      meeting = this.database.getMeeting(parseInt(query, 10));
    }

    if (!meeting) {
      const results = this.database.searchMeetings(query);
      if (results.length > 0) {
        meeting = results[0];
      }
    }

    if (!meeting) {
      const recent = this.database.getRecentMeetings(5);
      return {
        found: false,
        message: `No meeting found matching "${query}". Recent meetings:\n${recent.map(m => `  #${m.id}: ${m.title} (${m.date})`).join('\n')}`,
        recentMeetings: recent,
      };
    }

    return {
      found: true,
      meeting,
    };
  }

  async getActionItems(query) {
    log('AGENT', `Retrieving action items for: "${query}"`);

    if (/yesterday|today|last/i.test(query)) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      const meetings = this.database.getMeetingsByDateRange(yesterday, today);
      const items = meetings
        .filter(m => m.actionItems && m.actionItems.length > 0)
        .map(m => ({
          meetingId: m.id,
          meetingTitle: m.title,
          meetingDate: m.date,
          actionItems: m.actionItems,
        }));

      return {
        found: items.length > 0,
        actionItems: items,
        message: items.length > 0 ? null : 'No action items found for the requested time period.',
      };
    }

    if (/recent/i.test(query)) {
      const items = this.database.getRecentActionItems(5);
      return {
        found: items.length > 0,
        actionItems: items,
        message: items.length > 0 ? null : 'No recent action items found.',
      };
    }

    const meetings = this.database.searchMeetings(query);
    const items = meetings
      .filter(m => m.actionItems && m.actionItems.length > 0)
      .map(m => ({
        meetingId: m.id,
        meetingTitle: m.title,
        meetingDate: m.date,
        actionItems: m.actionItems,
      }));

    return {
      found: items.length > 0,
      actionItems: items,
      message: items.length > 0 ? null : `No action items found for "${query}".`,
    };
  }

  async sendToSlack(meetingData) {
    log('AGENT', 'Sending meeting data to Slack...');
    return this.slack.sendMeetingSummary(meetingData);
  }

  async sendActionItemsToSlack(query) {
    log('AGENT', `Sending action items to Slack for: "${query}"`);

    const result = await this.getActionItems(query);

    if (!result.found) {
      return { sent: false, message: result.message };
    }

    await this.slack.sendActionItems(result.actionItems);
    return {
      sent: true,
      message: `Sent ${result.actionItems.length} meeting(s) action items to Slack.`,
    };
  }

  async getDecisions(query) {
    log('AGENT', `Retrieving decisions for: "${query}"`);

    const meetings = this.database.searchMeetings(query);
    const withDecisions = meetings.filter(m => m.decisions && m.decisions.length > 0);

    if (withDecisions.length === 0) {
      const recent = this.database.getRecentMeetings(5);
      const recentWithDecisions = recent.filter(m => m.decisions && m.decisions.length > 0);

      if (recentWithDecisions.length > 0) {
        return {
          found: true,
          meetings: recentWithDecisions.map(m => ({
            id: m.id,
            title: m.title,
            date: m.date,
            decisions: m.decisions,
          })),
        };
      }

      return { found: false, message: `No decisions found for "${query}".` };
    }

    return {
      found: true,
      meetings: withDecisions.map(m => ({
        id: m.id,
        title: m.title,
        date: m.date,
        decisions: m.decisions,
      })),
    };
  }

  _parseLLMResponse(content) {
    return parseLLMResponse(content);
  }
}

export function parseLLMResponse(content) {
  const result = {
    summary: '',
    keyPoints: [],
    decisions: [],
    actionItems: [],
    risksBlockers: [],
  };

  const sections = content.split(/^## /m);

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('Overview')) {
      result.summary = trimmed.replace(/^Overview\s*\n/, '').trim();
    } else if (trimmed.startsWith('Key Discussion Points')) {
      const body = trimmed.replace(/^Key Discussion Points\s*\n/, '').trim();
      result.keyPoints = body
        .split('\n')
        .filter(l => l.trim().startsWith('-') || l.trim().startsWith('*') || /^\d+\./.test(l.trim()))
        .map(l => l.replace(/^[-*\d.]+/, '').trim())
        .filter(Boolean);
    } else if (trimmed.startsWith('Decisions')) {
      const body = trimmed.replace(/^Decisions\s*\n/, '').trim();
      result.decisions = body
        .split('\n')
        .filter(l => l.trim().startsWith('-') || l.trim().startsWith('*') || /^\d+\./.test(l.trim()))
        .map(l => l.replace(/^[-*\d.]+/, '').trim())
        .filter(Boolean);
    } else if (trimmed.startsWith('Risks & Blockers')) {
      const body = trimmed.replace(/^Risks & Blockers\s*\n/, '').trim();
      result.risksBlockers = body
        .split('\n')
        .filter(l => l.trim().startsWith('-') || l.trim().startsWith('*') || /^\d+\./.test(l.trim()))
        .map(l => l.replace(/^[-*\d.]+/, '').trim())
        .filter(Boolean);
    }
  }

  const actionItemSection = content.match(/## Action Items\s*\n([\s\S]*?)(?=\n## |\n# |$)/);
  if (actionItemSection) {
    const items = actionItemSection[1].trim().split('\n\n');
    result.actionItems = items
      .map(item => {
        const taskMatch = item.match(/Task:\s*(.+)/i);
        const ownerMatch = item.match(/Owner:\s*(.+)/i);
        const deadlineMatch = item.match(/Deadline:\s*(.+)/i);

        if (taskMatch) {
          return {
            task: taskMatch[1].trim(),
            owner: ownerMatch ? ownerMatch[1].trim() : 'Not specified',
            deadline: deadlineMatch ? deadlineMatch[1].trim() : 'Not specified',
          };
        }

        const lines = item.split('\n').filter(l => l.trim());
        if (lines.length > 0 && (lines[0].startsWith('-') || lines[0].startsWith('*'))) {
          return {
            task: lines[0].replace(/^[-*]\s*/, '').trim(),
            owner: 'Not specified',
            deadline: 'Not specified',
          };
        }

        return null;
      })
      .filter(Boolean);
  }

  if (!result.summary && !content.includes('## Overview')) {
    result.summary = content.replace(/# Meeting Summary\s*\n/, '').split('\n')[0].trim();
  }

  return result;
}
