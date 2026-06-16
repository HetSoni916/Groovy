"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProvider = getProvider;
const groq_1 = require("./groq");
const gemini_1 = require("./gemini");
const cohere_1 = require("./cohere");
const providers = {
    groq: groq_1.GroqProvider,
    gemini: gemini_1.GeminiProvider,
    cohere: cohere_1.CohereProvider,
};
function getProvider(name) {
    const providerName = (name || 'groq').toLowerCase();
    const ProviderClass = providers[providerName];
    if (!ProviderClass) {
        console.warn(`Unknown provider "${name}", falling back to groq`);
        return new groq_1.GroqProvider();
    }
    return new ProviderClass();
}
//# sourceMappingURL=index.js.map