"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countTokens = countTokens;
exports.truncateToTokens = truncateToTokens;
exports.buildContextWindow = buildContextWindow;
function countTokens(text) {
    if (!text)
        return 0;
    const words = text.trim().split(/\s+/);
    return Math.ceil(words.length * 1.3);
}
function truncateToTokens(text, maxTokens) {
    const words = text.trim().split(/\s+/);
    const maxWords = Math.floor(maxTokens / 1.3);
    if (words.length <= maxWords)
        return text;
    return words.slice(0, maxWords).join(' ');
}
function buildContextWindow(chunks, maxTokens) {
    let context = '';
    let currentTokens = 0;
    for (const chunk of chunks) {
        const chunkTokens = chunk.tokenCount || countTokens(chunk.content);
        if (currentTokens + chunkTokens > maxTokens) {
            const remaining = maxTokens - currentTokens;
            if (remaining > 20) {
                context += '\n\n' + truncateToTokens(chunk.content, remaining);
            }
            break;
        }
        if (context)
            context += '\n\n';
        context += chunk.content;
        currentTokens += chunkTokens;
    }
    return context;
}
//# sourceMappingURL=tokenizer.js.map