"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertMeeting = insertMeeting;
exports.getMeetingById = getMeetingById;
exports.listMeetings = listMeetings;
exports.searchMeetings = searchMeetings;
exports.getActionItemsForMeeting = getActionItemsForMeeting;
exports.getRecentActionItems = getRecentActionItems;
const crypto_1 = require("crypto");
const connection_1 = require("./connection");
connection_1.db.exec(`
  CREATE TABLE IF NOT EXISTS meetings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    meeting_date_time TEXT NOT NULL,
    participants_json TEXT NOT NULL,
    transcript TEXT NOT NULL,
    overview TEXT NOT NULL,
    key_points_json TEXT NOT NULL,
    decisions_json TEXT NOT NULL,
    risks_json TEXT NOT NULL,
    deadline_warnings_json TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS action_items (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL,
    task TEXT NOT NULL,
    owner TEXT,
    deadline TEXT,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date_time DESC);
  CREATE INDEX IF NOT EXISTS idx_meetings_title ON meetings(title);
  CREATE INDEX IF NOT EXISTS idx_action_items_meeting ON action_items(meeting_id);
`);
function parseList(value) {
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map(String) : [];
    }
    catch {
        return [];
    }
}
function toActionItems(rows) {
    return rows.map((row) => ({
        id: row.id,
        meetingId: row.meeting_id,
        task: row.task,
        owner: row.owner,
        deadline: row.deadline,
        status: row.status,
        createdAt: row.created_at,
    }));
}
function toMeetingRecord(row, actionItems) {
    return {
        id: row.id,
        title: row.title,
        meetingDateTime: row.meeting_date_time,
        participants: parseList(row.participants_json),
        transcript: row.transcript,
        overview: row.overview,
        keyDiscussionPoints: parseList(row.key_points_json),
        decisions: parseList(row.decisions_json),
        actionItems: actionItems.map((item) => ({
            task: item.task,
            owner: item.owner,
            deadline: item.deadline,
            status: item.status,
        })),
        risksOrBlockers: parseList(row.risks_json),
        deadlineWarnings: parseList(row.deadline_warnings_json),
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
function getActionItemsByMeetingId(meetingId) {
    const rows = connection_1.db.prepare('SELECT * FROM action_items WHERE meeting_id = ? ORDER BY created_at ASC').all(meetingId);
    return toActionItems(rows);
}
function insertMeeting(analysis, transcript, meetingDateTime, status) {
    const id = (0, crypto_1.randomUUID)();
    const timestamp = new Date().toISOString();
    connection_1.db.prepare(`
    INSERT INTO meetings (
      id, title, meeting_date_time, participants_json, transcript, overview,
      key_points_json, decisions_json, risks_json, deadline_warnings_json,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, analysis.title, meetingDateTime, JSON.stringify(analysis.participants), transcript, analysis.overview, JSON.stringify(analysis.keyDiscussionPoints), JSON.stringify(analysis.decisions), JSON.stringify(analysis.risksOrBlockers), JSON.stringify(analysis.deadlineWarnings), status, timestamp, timestamp);
    const actionStatement = connection_1.db.prepare(`
    INSERT INTO action_items (id, meeting_id, task, owner, deadline, status, created_at)
    VALUES (@id, @meetingId, @task, @owner, @deadline, @status, @createdAt)
  `);
    const actionItems = analysis.actionItems.map((item) => ({
        id: (0, crypto_1.randomUUID)(),
        meetingId: id,
        task: item.task,
        owner: item.owner,
        deadline: item.deadline,
        status: item.status,
        createdAt: timestamp,
    }));
    const insertActionItems = connection_1.db.transaction((items) => {
        for (const item of items) {
            actionStatement.run(item);
        }
    });
    insertActionItems(actionItems);
    return getMeetingById(id);
}
function getMeetingById(id) {
    const row = connection_1.db.prepare('SELECT * FROM meetings WHERE id = ?').get(id);
    if (!row) {
        return null;
    }
    return toMeetingRecord(row, getActionItemsByMeetingId(id));
}
function listMeetings(limit = 20) {
    const rows = connection_1.db.prepare('SELECT * FROM meetings ORDER BY meeting_date_time DESC, created_at DESC LIMIT ?').all(limit);
    return rows.map((row) => toMeetingRecord(row, getActionItemsByMeetingId(row.id)));
}
function searchMeetings(query, limit = 10) {
    const term = `%${query.trim().toLowerCase()}%`;
    const rows = connection_1.db.prepare(`
    SELECT * FROM meetings
    WHERE lower(title) LIKE ?
      OR lower(transcript) LIKE ?
      OR lower(overview) LIKE ?
      OR lower(key_points_json) LIKE ?
      OR lower(decisions_json) LIKE ?
      OR lower(risks_json) LIKE ?
      OR lower(participants_json) LIKE ?
    ORDER BY meeting_date_time DESC, created_at DESC
    LIMIT ?
  `).all(term, term, term, term, term, term, term, limit);
    return rows.map((row) => toMeetingRecord(row, getActionItemsByMeetingId(row.id)));
}
function getActionItemsForMeeting(meetingId) {
    return getActionItemsByMeetingId(meetingId);
}
function getRecentActionItems(limit = 20) {
    const rows = connection_1.db.prepare('SELECT * FROM action_items ORDER BY created_at DESC LIMIT ?').all(limit);
    return toActionItems(rows);
}
//# sourceMappingURL=meetingModel.js.map