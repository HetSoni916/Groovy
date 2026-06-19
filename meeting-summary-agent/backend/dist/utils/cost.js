"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateCost = estimateCost;
exports.formatMoney = formatMoney;
const PRICE_TABLE = {
    'gpt-4.1-mini': { input: 0.4 / 1_000_000, output: 1.6 / 1_000_000 },
    'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
};
function estimateCost(model, inputTokens = 0, outputTokens = 0) {
    const prices = PRICE_TABLE[model] ?? PRICE_TABLE['gpt-4.1-mini'];
    return inputTokens * prices.input + outputTokens * prices.output;
}
function formatMoney(value) {
    return `$${value.toFixed(4)}`;
}
//# sourceMappingURL=cost.js.map