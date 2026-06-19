"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const meetingAgent_1 = require("../agent/meetingAgent");
const databaseTool_1 = require("../tools/databaseTool");
const router = (0, express_1.Router)();
router.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'groovy-meeting-summary-agent' });
});
router.get('/meetings', (req, res) => {
    const limit = Number(req.query.limit ?? 20);
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const meetings = q ? databaseTool_1.databaseTool.searchMeetings(q, Number.isNaN(limit) ? 10 : limit) : databaseTool_1.databaseTool.listMeetings(Number.isNaN(limit) ? 20 : limit);
    res.json({ meetings });
});
router.get('/meetings/:id', (req, res) => {
    const meeting = databaseTool_1.databaseTool.getMeetingById(req.params.id);
    if (!meeting) {
        res.status(404).json({ error: 'Meeting not found.' });
        return;
    }
    res.json({ meeting });
});
router.post('/meetings/analyze', async (req, res, next) => {
    try {
        const result = await (0, meetingAgent_1.analyzeMeeting)(req.body);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
router.post('/assistant/query', async (req, res, next) => {
    try {
        const result = await (0, meetingAgent_1.answerMeetingQuestion)(req.body);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
router.post('/meetings/:id/slack', async (req, res, next) => {
    try {
        const mode = req.body.mode ?? 'action_items';
        const meeting = await (0, meetingAgent_1.sendMeetingSlackUpdate)(req.params.id, mode);
        res.json({ ok: true, meeting });
    }
    catch (error) {
        next(error);
    }
});
router.get('/meetings/:id/action-items', (req, res) => {
    const items = databaseTool_1.databaseTool.getActionItemsForMeeting(req.params.id);
    res.json({ items });
});
exports.default = router;
//# sourceMappingURL=index.js.map