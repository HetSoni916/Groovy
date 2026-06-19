"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countTokens = countTokens;
exports.truncateToTokens = truncateToTokens;
function countTokens(text) {
    if (!text)
        return 0;
    return Math.ceil(text.split(/\s+/).length * 1.3);
}
function truncateToTokens(text, maxTokens) {
    const words = text.split(/\s+/);
    const maxWords = Math.floor(maxTokens / 1.3);
    if (words.length <= maxWords)
        return text;
    return words.slice(0, maxWords).join(' ');
}
//# sourceMappingURL=tokenizer.js.map