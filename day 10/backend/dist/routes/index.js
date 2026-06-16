"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const config_1 = require("../config");
const rateLimiter_1 = require("../middleware/rateLimiter");
const repoController_1 = require("../controllers/repoController");
const chatController_1 = require("../controllers/chatController");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    dest: require('os').tmpdir() + '/uploads/',
    limits: { fileSize: config_1.config.maxFileSize },
});
// Repo routes
router.get('/repos', repoController_1.listAllRepos);
router.get('/repos/:id', repoController_1.getRepoById);
router.get('/repos/:id/summary', repoController_1.getRepoSummary);
router.get('/repos/:id/files', repoController_1.getRepoFiles);
router.get('/repos/:id/files/*', repoController_1.getFileContent);
// Upload accepts both multipart (file upload) and JSON body (path)
router.post('/repos/upload', (req, res, next) => {
    if (req.is('multipart/form-data')) {
        upload.single('repo')(req, res, next);
    }
    else {
        // JSON body with repoPath
        (0, repoController_1.scanPath)(req, res, next);
    }
}, repoController_1.uploadRepo);
router.post('/repos/scan', repoController_1.scanPath);
// Chat routes
router.post('/chat', rateLimiter_1.rateLimiter, chatController_1.askQuestion);
router.post('/chat/ask', rateLimiter_1.rateLimiter, chatController_1.askQuestion);
// Health check
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
exports.default = router;
//# sourceMappingURL=index.js.map