"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_1 = require("../middleware/upload");
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../schemas");
const pdfController_1 = require("../controllers/pdfController");
const chatController_1 = require("../controllers/chatController");
const agentController_1 = require("../controllers/agentController");
const router = (0, express_1.Router)();
router.post('/pdf/upload', upload_1.upload.single('pdf'), pdfController_1.uploadPdf);
router.get('/pdf/list', pdfController_1.listPdfs);
router.delete('/pdf/:id', (0, validate_1.validateParams)(schemas_1.DeletePdfParamsSchema), pdfController_1.deletePdf);
router.post('/chat/ask', (0, validate_1.validateBody)(schemas_1.QueryRequestSchema), chatController_1.askQuestion);
router.get('/chat/history', chatController_1.getChatHistory);
router.delete('/chat/history', chatController_1.clearChatHistory);
router.post('/agent/ask', agentController_1.askAgent);
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
exports.default = router;
//# sourceMappingURL=index.js.map