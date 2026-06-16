"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.config = {
    port: parseInt(process.env.PORT || '3001', 10),
    maxFileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10)) * 1024 * 1024,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '30', 10),
    apiKeys: {
        groq: process.env.GROQ_API_KEY || '',
        gemini: process.env.GEMINI_API_KEY || '',
        cohere: process.env.COHERE_API_KEY || '',
    },
};
//# sourceMappingURL=index.js.map