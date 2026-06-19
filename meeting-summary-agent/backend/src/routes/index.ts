import { Router } from 'express';
import { analyzeMeeting, answerMeetingQuestion, sendMeetingSlackUpdate } from '../agent/meetingAgent';
import { databaseTool } from '../tools/databaseTool';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'groovy-meeting-summary-agent' });
});

router.get('/meetings', (req, res) => {
  const limit = Number(req.query.limit ?? 20);
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  const meetings = q ? databaseTool.searchMeetings(q, Number.isNaN(limit) ? 10 : limit) : databaseTool.listMeetings(Number.isNaN(limit) ? 20 : limit);
  res.json({ meetings });
});

router.get('/meetings/:id', (req, res) => {
  const meeting = databaseTool.getMeetingById(req.params.id);
  if (!meeting) {
    res.status(404).json({ error: 'Meeting not found.' });
    return;
  }

  res.json({ meeting });
});

router.post('/meetings/analyze', async (req, res, next) => {
  try {
    const result = await analyzeMeeting(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/assistant/query', async (req, res, next) => {
  try {
    const result = await answerMeetingQuestion(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/meetings/:id/slack', async (req, res, next) => {
  try {
    const mode = req.body.mode ?? 'action_items';
    const meeting = await sendMeetingSlackUpdate(req.params.id, mode);
    res.json({ ok: true, meeting });
  } catch (error) {
    next(error);
  }
});

router.get('/meetings/:id/action-items', (req, res) => {
  const items = databaseTool.getActionItemsForMeeting(req.params.id);
  res.json({ items });
});

export default router;