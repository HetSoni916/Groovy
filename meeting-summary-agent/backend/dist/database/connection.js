"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const env_1 = require("../config/env");
const absoluteDbPath = path_1.default.resolve(process.cwd(), env_1.env.DATABASE_PATH);
fs_1.default.mkdirSync(path_1.default.dirname(absoluteDbPath), { recursive: true });
exports.db = new better_sqlite3_1.default(absoluteDbPath);
exports.db.pragma('journal_mode = WAL');
exports.db.pragma('foreign_keys = ON');
//# sourceMappingURL=connection.js.map