"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groqService = exports.GroqService = void 0;
const config_1 = require("../config");
const tokenizer_1 = require("../utils/tokenizer");
const pricing_1 = require("../utils/pricing");
const MODEL = 'llama-3.3-70b-versatile';
class GroqService {
    async generateResponse(systemPrompt, context, question) {
        if (!config_1.config.groqApiKey) {
            throw new Error('GROQ_API_KEY is not configured');
        }
        const userContent = `CONTEXT FROM NOTES:\n${context}\n\n---\n\nQUESTION: ${question}`;
        const inputTokens = (0, tokenizer_1.countTokens)(systemPrompt) + (0, tokenizer_1.countTokens)(userContent);
        const startTime = Date.now();
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config_1.config.groqApiKey}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userContent },
                ],
                temperature: 0.3,
                max_tokens: 4096,
            }),
        });
        const latencyMs = Date.now() - startTime;
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Groq API error (${response.status}): ${errorBody}`);
        }
        const data = await response.json();
        const answer = data.choices?.[0]?.message?.content || '';
        const outputTokens = (0, tokenizer_1.countTokens)(answer);
        const totalTokens = inputTokens + outputTokens;
        const cost = (0, pricing_1.calculateCost)(inputTokens, outputTokens, MODEL);
        return {
            answer,
            usage: {
                inputTokens,
                outputTokens,
                totalTokens,
                cost,
                latencyMs,
                model: MODEL,
            },
        };
    }
}
exports.GroqService = GroqService;
exports.groqService = new GroqService();
//# sourceMappingURL=anthropic.service.js.map