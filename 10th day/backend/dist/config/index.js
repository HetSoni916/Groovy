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
    maxFileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10)) * 1024 * 1024,
    groqApiKey: process.env.GROQ_API_KEY || '',
    storageDir: path_1.default.resolve(__dirname, '../../storage'),
    maxContextTokens: 8000,
    systemPromptBudget: 0.10,
    contextBudget: 0.80,
    questionBudget: 0.10,
    chunkTokenLimit: 500,
    maxChunksSelected: 3,
    embeddingModel: process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2',
    useReranker: process.env.USE_RERANKER === 'true',
    rerankerTopK: parseInt(process.env.RERANKER_TOP_K || '3', 10),
    rerankerFirstPassK: parseInt(process.env.RERANKER_FIRST_PASS_K || '10', 10),
};
//# sourceMappingURL=index.js.map