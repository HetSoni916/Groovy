"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askQuestion = askQuestion;
const repoService_1 = require("../services/repoService");
const retrieval_1 = require("../services/retrieval");
async function askQuestion(req, res, next) {
    try {
        const { repoId, question, mode, provider } = req.body;
        if (!repoId || !question) {
            res.status(400).json({ error: 'repoId and question are required' });
            return;
        }
        const repo = (0, repoService_1.getRepo)(repoId);
        if (!repo) {
            res.status(404).json({ error: 'Repository not found' });
            return;
        }
        const results = await (0, retrieval_1.search)(question, repo, 5);
        if (results.length === 0) {
            res.json({
                answer: 'I could not find any relevant code in the repository to answer your question. Please try a different question or check if the repository was scanned correctly.',
                references: [],
                usage: { input: 0, output: 0, cost: 0 },
            });
            return;
        }
        const response = await (0, retrieval_1.buildAnswer)(question, results, provider || 'groq', mode || 'beginner');
        res.json(response);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=chatController.js.map