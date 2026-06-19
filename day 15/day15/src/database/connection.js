import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { env } from '../config/env.js';
import { log } from '../logger.js';

let db = null;

export function getDb() {
  if (db) return db;

  const dbPath = resolve(env.DATABASE_PATH);
  const dbDir = dirname(dbPath);

  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  log('DB', `Opening database at ${dbPath}`);
  db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initializeSchema();

  return db;
}

function initializeSchema() {
  log('DB', 'Initializing database schema');

  db.exec(`
    CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      participants TEXT NOT NULL DEFAULT '[]',
      transcript TEXT NOT NULL,
      summary TEXT NOT NULL,
      key_points TEXT NOT NULL DEFAULT '[]',
      decisions TEXT NOT NULL DEFAULT '[]',
      action_items TEXT NOT NULL DEFAULT '[]',
      risks_blockers TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'completed',
      token_usage TEXT,
      cost_estimate REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  log('DB', 'Schema initialized');
}

export function closeDb() {
  if (db) {
    log('DB', 'Closing database connection');
    db.close();
    db = null;
  }
}
