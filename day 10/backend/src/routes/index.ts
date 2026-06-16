import { Router } from 'express';
import multer from 'multer';
import { config } from '../config';
import { rateLimiter } from '../middleware/rateLimiter';
import { uploadRepo, scanPath, getRepoById, getRepoSummary, getRepoDescription, listAllRepos, getRepoFiles, getFileContent } from '../controllers/repoController';
import { askQuestion } from '../controllers/chatController';

const router = Router();

const upload = multer({
  dest: require('os').tmpdir() + '/uploads/',
  limits: { fileSize: config.maxFileSize },
});

// Repo routes
router.get('/repos', listAllRepos);
router.get('/repos/:id', getRepoById);
router.get('/repos/:id/summary', getRepoSummary);
router.get('/repos/:id/description', getRepoDescription);
router.get('/repos/:id/files', getRepoFiles);
router.get('/repos/:id/files/*', getFileContent);

// Upload accepts both multipart (file upload) and JSON body (path)
router.post('/repos/upload', (req: any, res: any, next: any) => {
  if (req.is('multipart/form-data')) {
    upload.single('repo')(req, res, next);
  } else {
    // JSON body with repoPath
    scanPath(req, res, next);
  }
}, uploadRepo);

router.post('/repos/scan', scanPath);

// Chat routes
router.post('/chat', rateLimiter, askQuestion);
router.post('/chat/ask', rateLimiter, askQuestion);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
