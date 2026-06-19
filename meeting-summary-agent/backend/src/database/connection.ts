import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { env } from '../config/env';

const absoluteDbPath = path.resolve(process.cwd(), env.DATABASE_PATH);
fs.mkdirSync(path.dirname(absoluteDbPath), { recursive: true });

export const db = new Database(absoluteDbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');