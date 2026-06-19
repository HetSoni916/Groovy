"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askQuestion = askQuestion;
exports.getChatHistory = getChatHistory;
exports.clearChatHistory = clearChatHistory;
const retrieval_1 = require("../services/retrieval");
const anthropic_service_1 = require("../services/anthropic.service");
const storage_1 = require("../utils/storage");
const uuid_1 = require("uuid");
const SYSTEM_PROMPT = `You are a helpful note assistant. Your role is to answer questions using ONLY the provided PDF content.

RULES:
- Answer only from the provided context. Never use external knowledge.
- If the context does not contain the answer, respond: "I could not find this information in the uploaded notes."
- INLINE CITATIONS REQUIRED: Cite the source chunk ID and page number for each fact in parentheses, e.g. (chunk: abc12345, Page 3).
- Each paragraph must end with a citation to its source chunk.
- Format answers using markdown for readability.
- Be concise but complete.
- If the context is unclear, acknowledge the uncertainty.`;
async function askQuestion(req, res, next) {
    try {
        const { question, documentIds } = req.body;
        if (!question || !question.trim()) {
            res.status(400).json({ error: 'Question is required' });
            return;
        }
        const scoredChunks = await retrieval_1.retrievalService.search(question, documentIds);
        const context = retrieval_1.retrievalService.buildContext(scoredChunks);
        if (!context.trim()) {
            res.json({
                answer: 'I could not find this information in the uploaded notes.',
                sources: [],
                usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: 0, latencyMs: 0, model: 'llama-3.3-70b-versatile' },
            });
            return;
        }
        const result = await anthropic_service_1.groqService.generateResponse(SYSTEM_PROMPT, context, question);
        const documents = storage_1.storage.getDocuments();
        const docMap = new Map(documents.map(d => [d.id, d]));
        const sources = [];
        const seen = new Set();
        const chunks = [];
        for (const { chunk, score } of scoredChunks) {
            const doc = docMap.get(chunk.documentId);
            const key = `${doc?.filename}-${chunk.pageStart}`;
            if (!seen.has(key) && doc) {
                seen.add(key);
                sources.push({ filename: doc.filename, pageNumber: chunk.pageStart });
            }
            chunks.push({
                id: chunk.id.substring(0, 8),
                documentId: chunk.documentId,
                filename: doc?.filename || 'Unknown',
                pageStart: chunk.pageStart,
                pageEnd: chunk.pageEnd,
                content: chunk.content.substring(0, 120),
                score: Math.round(score * 10000) / 10000,
            });
        }
        const entry = {
            id: (0, uuid_1.v4)(),
            question,
            answer: result.answer,
            sources,
            usage: result.usage,
            timestamp: new Date().toISOString(),
        };
        storage_1.storage.saveChat(entry);
        res.json({
            answer: result.answer,
            sources,
            usage: result.usage,
            chunks,
        });
    }
    catch (err) {
        next(err);
    }
}
async function getChatHistory(_req, res, next) {
    try {
        const history = storage_1.storage.getChatHistory();
        res.json(history);
    }
    catch (err) {
        next(err);
    }
}
async function clearChatHistory(_req, res, next) {
    try {
        storage_1.storage.clearChatHistory();
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=chatController.js.map