"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pricing = void 0;
exports.calculateCost = calculateCost;
exports.pricing = {
    'llama-3.3-70b-versatile': {
        inputCostPerMillionTokens: 0.59,
        outputCostPerMillionTokens: 0.79,
    },
    'llama-3.1-8b-instant': {
        inputCostPerMillionTokens: 0.05,
        outputCostPerMillionTokens: 0.08,
    },
};
function calculateCost(inputTokens, outputTokens, model = 'llama-3.3-70b-versatile') {
    const price = exports.pricing[model] || { inputCostPerMillionTokens: 0.59, outputCostPerMillionTokens: 0.79 };
    const inputCost = (inputTokens / 1000000) * price.inputCostPerMillionTokens;
    const outputCost = (outputTokens / 1000000) * price.outputCostPerMillionTokens;
    return Math.round((inputCost + outputCost) * 100000) / 100000;
}
//# sourceMappingURL=pricing.js.map