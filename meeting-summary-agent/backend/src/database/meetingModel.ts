import { randomUUID } from 'crypto';
import { db } from './connection';
import { ActionItem, MeetingAnalysis, MeetingRecord, MeetingStatus, StoredActionItem } from '../types';

db.exec(`
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

type MeetingRow = {
  id: string;
  title: string;
  meeting_date_time: string;
  participants_json: string;
  transcript: string;
  overview: string;
  key_points_json: string;
  decisions_json: string;
  risks_json: string;
  deadline_warnings_json: string;
  status: MeetingStatus;
  created_at: string;
  updated_at: string;
};

type ActionItemRow = {
  id: string;
  meeting_id: string;
  task: string;
  owner: string | null;
  deadline: string | null;
  status: ActionItem['status'];
  created_at: string;
};

function parseList(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function toActionItems(rows: ActionItemRow[]): StoredActionItem[] {
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

function toMeetingRecord(row: MeetingRow, actionItems: StoredActionItem[]): MeetingRecord {
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

function getActionItemsByMeetingId(meetingId: string): StoredActionItem[] {
  const rows = db.prepare('SELECT * FROM action_items WHERE meeting_id = ? ORDER BY created_at ASC').all(meetingId) as ActionItemRow[];
  return toActionItems(rows);
}

export function insertMeeting(analysis: MeetingAnalysis, transcript: string, meetingDateTime: string, status: MeetingStatus): MeetingRecord {
  const id = randomUUID();
  const timestamp = new Date().toISOString();

  db.prepare(`
    INSERT INTO meetings (
      id, title, meeting_date_time, participants_json, transcript, overview,
      key_points_json, decisions_json, risks_json, deadline_warnings_json,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    analysis.title,
    meetingDateTime,
    JSON.stringify(analysis.participants),
    transcript,
    analysis.overview,
    JSON.stringify(analysis.keyDiscussionPoints),
    JSON.stringify(analysis.decisions),
    JSON.stringify(analysis.risksOrBlockers),
    JSON.stringify(analysis.deadlineWarnings),
    status,
    timestamp,
    timestamp
  );

  const actionStatement = db.prepare(`
    INSERT INTO action_items (id, meeting_id, task, owner, deadline, status, created_at)
    VALUES (@id, @meetingId, @task, @owner, @deadline, @status, @createdAt)
  `);

  const actionItems = analysis.actionItems.map((item) => ({
    id: randomUUID(),
    meetingId: id,
    task: item.task,
    owner: item.owner,
    deadline: item.deadline,
    status: item.status,
    createdAt: timestamp,
  }));

  const insertActionItems = db.transaction((items: typeof actionItems) => {
    for (const item of items) {
      actionStatement.run(item);
    }
  });

  insertActionItems(actionItems);
  return getMeetingById(id) as MeetingRecord;
}

export function getMeetingById(id: string): MeetingRecord | null {
  const row = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id) as MeetingRow | undefined;
  if (!row) {
    return null;
  }

  return toMeetingRecord(row, getActionItemsByMeetingId(id));
}

export function listMeetings(limit = 20): MeetingRecord[] {
  const rows = db.prepare('SELECT * FROM meetings ORDER BY meeting_date_time DESC, created_at DESC LIMIT ?').all(limit) as MeetingRow[];
  return rows.map((row) => toMeetingRecord(row, getActionItemsByMeetingId(row.id)));
}

export function searchMeetings(query: string, limit = 10): MeetingRecord[] {
  const term = `%${query.trim().toLowerCase()}%`;
  const rows = db.prepare(`
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
  `).all(term, term, term, term, term, term, term, limit) as MeetingRow[];

  return rows.map((row) => toMeetingRecord(row, getActionItemsByMeetingId(row.id)));
}

export function getActionItemsForMeeting(meetingId: string): StoredActionItem[] {
  return getActionItemsByMeetingId(meetingId);
}

export function getRecentActionItems(limit = 20): StoredActionItem[] {
  const rows = db.prepare('SELECT * FROM action_items ORDER BY created_at DESC LIMIT ?').all(limit) as ActionItemRow[];
  return toActionItems(rows);
}