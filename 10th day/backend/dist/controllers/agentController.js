"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askAgent = askAgent;
const agent_service_1 = require("../services/agent.service");
async function askAgent(req, res) {
    const { question } = req.body;
    if (!question || typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({ error: 'question is required (non-empty string)' });
    }
    try {
        const answer = await (0, agent_service_1.runAgent)(question.trim());
        res.json({ question: question.trim(), answer });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Agent call failed' });
    }
}
//# sourceMappingURL=agentController.js.map