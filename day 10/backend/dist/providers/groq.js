"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqProvider = void 0;
const config_1 = require("../config");
class GroqProvider {
    constructor() {
        this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        this.apiKey = config_1.config.apiKeys.groq;
        if (!this.apiKey) {
            console.warn('GROQ_API_KEY is not set. Groq provider will fail.');
        }
    }
    async generateResponse(messages) {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                temperature: 0.3,
                max_tokens: 4096,
            }),
        });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Groq API error (${response.status}): ${errorBody}`);
        }
        const data = await response.json();
        return data.choices[0].message.content;
    }
}
exports.GroqProvider = GroqProvider;
//# sourceMappingURL=groq.js.map