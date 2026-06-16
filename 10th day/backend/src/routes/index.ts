import { Router } from 'express';
import { upload } from '../middleware/upload';
import { uploadPdf, listPdfs, deletePdf } from '../controllers/pdfController';
import { askQuestion, getChatHistory, clearChatHistory } from '../controllers/chatController';

const router = Router();

router.post('/pdf/upload', upload.single('pdf'), uploadPdf);
router.get('/pdf/list', listPdfs);
router.delete('/pdf/:id', deletePdf);

router.post('/chat/ask', askQuestion);
router.get('/chat/history', getChatHistory);
router.delete('/chat/history', clearChatHistory);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
