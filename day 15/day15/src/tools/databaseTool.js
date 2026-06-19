import { getDb } from '../database/connection.js';
import { log } from '../logger.js';

export class DatabaseTool {
  constructor() {
    this.db = getDb();
  }

  saveMeeting(data) {
    log('DB-TOOL', `Saving meeting: "${data.title}"`);

    const stmt = this.db.prepare(`
      INSERT INTO meetings (title, date, participants, transcript, summary, key_points, decisions, action_items, risks_blockers, status, token_usage, cost_estimate)
      VALUES (@title, @date, @participants, @transcript, @summary, @keyPoints, @decisions, @actionItems, @risksBlockers, @status, @tokenUsage, @costEstimate)
    `);

    const result = stmt.run({
      title: data.title,
      date: data.date,
      participants: JSON.stringify(data.participants || []),
      transcript: data.transcript,
      summary: data.summary,
      keyPoints: JSON.stringify(data.keyPoints || []),
      decisions: JSON.stringify(data.decisions || []),
      actionItems: JSON.stringify(data.actionItems || []),
      risksBlockers: JSON.stringify(data.risksBlockers || []),
      status: data.status || 'completed',
      tokenUsage: JSON.stringify(data.tokenUsage || {}),
      costEstimate: data.costEstimate || 0,
    });

    log('DB-TOOL', `Meeting saved with ID: ${result.lastInsertRowid}`);
    return { id: Number(result.lastInsertRowid) };
  }

  getMeeting(id) {
    log('DB-TOOL', `Fetching meeting ID: ${id}`);
    const row = this.db.prepare('SELECT * FROM meetings WHERE id = ?').get(id);

    if (!row) return null;

    return this._parseRow(row);
  }

  searchMeetings(query) {
    log('DB-TOOL', `Searching meetings: "${query}"`);
    const likeQuery = `%${query}%`;

    const rows = this.db.prepare(`
      SELECT * FROM meetings
      WHERE title LIKE ? OR summary LIKE ? OR decisions LIKE ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(likeQuery, likeQuery, likeQuery);

    return rows.map(r => this._parseRow(r));
  }

  getRecentMeetings(limit = 10) {
    log('DB-TOOL', `Fetching ${limit} recent meetings`);
    const rows = this.db.prepare('SELECT * FROM meetings ORDER BY created_at DESC LIMIT ?').all(limit);
    return rows.map(r => this._parseRow(r));
  }

  getMeetingsByDateRange(startDate, endDate) {
    log('DB-TOOL', `Fetching meetings from ${startDate} to ${endDate}`);
    const rows = this.db.prepare(`
      SELECT * FROM meetings WHERE date >= ? AND date <= ? ORDER BY created_at DESC
    `).all(startDate, endDate);

    return rows.map(r => this._parseRow(r));
  }

  getActionItemsForMeeting(meetingId) {
    const meeting = this.getMeeting(meetingId);
    if (!meeting) return null;
    return { meetingId: meeting.id, meetingTitle: meeting.title, actionItems: meeting.actionItems };
  }

  getRecentActionItems(limit = 5) {
    log('DB-TOOL', `Fetching ${limit} recent action items`);
    const meetings = this.getRecentMeetings(limit);
    return meetings
      .filter(m => m.actionItems && m.actionItems.length > 0)
      .map(m => ({
        meetingId: m.id,
        meetingTitle: m.title,
        meetingDate: m.date,
        actionItems: m.actionItems,
      }));
  }

  deleteMeeting(id) {
    log('DB-TOOL', `Deleting meeting ID: ${id}`);
    const result = this.db.prepare('DELETE FROM meetings WHERE id = ?').run(id);
    return { deleted: result.changes > 0 };
  }

  _parseRow(row) {
    return {
      id: row.id,
      title: row.title,
      date: row.date,
      participants: JSON.parse(row.participants || '[]'),
      transcript: row.transcript,
      summary: row.summary,
      keyPoints: JSON.parse(row.key_points || '[]'),
      decisions: JSON.parse(row.decisions || '[]'),
      actionItems: JSON.parse(row.action_items || '[]'),
      risksBlockers: JSON.parse(row.risks_blockers || '[]'),
      status: row.status,
      tokenUsage: JSON.parse(row.token_usage || '{}'),
      costEstimate: row.cost_estimate,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
