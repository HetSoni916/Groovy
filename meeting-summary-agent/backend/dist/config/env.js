"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    OPENAI_API_KEY: zod_1.z.string().min(1, 'OPENAI_API_KEY is required'),
    OPENAI_MODEL: zod_1.z.string().default('gpt-4.1-mini'),
    SLACK_WEBHOOK_URL: zod_1.z.string().optional().default(''),
    PORT: zod_1.z.coerce.number().default(3001),
    DATABASE_PATH: zod_1.z.string().default('./storage/meetings.db'),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:5173'),
});
exports.env = envSchema.parse(process.env);
//# sourceMappingURL=env.js.map