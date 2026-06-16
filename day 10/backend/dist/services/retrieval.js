"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = search;
exports.buildAnswer = buildAnswer;
const vectorStore_1 = require("../utils/vectorStore");
const tokenizer_1 = require("../utils/tokenizer");
const providers_1 = require("../providers");
const MAX_CONTEXT_TOKENS = 7000;
function getSystemPrompt(mode) {
    if (mode === 'beginner') {
        return `You are a friendly code explainer for beginners. Explain code concepts in simple terms, avoiding jargon where possible. When you use technical terms, briefly explain them. Use analogies and examples. Break down complex ideas into small steps. Format your response with clear sections. Be encouraging and patient.`;
    }
    return `You are an expert code analyst. Provide detailed technical explanations of code architecture, design patterns, and implementation details. Reference specific code structures, algorithms, and conventions. Discuss trade-offs and alternative approaches. Use precise technical terminology. Assume the reader has strong programming knowledge.`;
}
async function search(query, repo, topK = 5) {
    const store = new vectorStore_1.VectorStore();
    for (const chunk of repo.chunks) {
        const text = `${chunk.filePath}\n${chunk.summary}\n${chunk.content}`;
        store.addChunk(chunk.id, text, chunk);
    }
    return store.search(query, topK);
}
async function buildAnswer(question, results, provider, mode) {
    const chunks = results.map(r => r.chunk);
    const context = (0, tokenizer_1.buildContextWindow)(chunks, MAX_CONTEXT_TOKENS);
    const systemPrompt = getSystemPrompt(mode);
    const inputTokens = (0, tokenizer_1.countTokens)(question) + (0, tokenizer_1.countTokens)(context) + (0, tokenizer_1.countTokens)(systemPrompt);
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Here is the relevant code from the repository:\n\n${context}\n\n---\n\nQuestion: ${question}\n\nPlease answer the question based on the code provided above. Reference specific files and line numbers where relevant.` },
    ];
    const aiProvider = (0, providers_1.getProvider)(provider);
    const answer = await aiProvider.generateResponse(messages);
    const outputTokens = (0, tokenizer_1.countTokens)(answer);
    const totalInput = inputTokens;
    const totalOutput = outputTokens;
    const cost = (totalInput / 1000000) * 0.59 + (totalOutput / 1000000) * 0.79;
    const references = results.map(r => {
        const lines = r.chunk.startLine === r.chunk.endLine
            ? `Line ${r.chunk.startLine}`
            : `Lines ${r.chunk.startLine}-${r.chunk.endLine}`;
        return {
            file: r.chunk.filePath,
            lines,
            snippet: r.chunk.summary.substring(0, 100),
        };
    });
    return {
        answer,
        references,
        usage: {
            input: totalInput,
            output: totalOutput,
            cost: Math.round(cost * 100000) / 100000,
        },
    };
}
//# sourceMappingURL=retrieval.js.map