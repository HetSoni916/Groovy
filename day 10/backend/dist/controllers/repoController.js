"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRepo = uploadRepo;
exports.scanPath = scanPath;
exports.getRepoById = getRepoById;
exports.getRepoSummary = getRepoSummary;
exports.listAllRepos = listAllRepos;
exports.getRepoFiles = getRepoFiles;
exports.getFileContent = getFileContent;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const repoService_1 = require("../services/repoService");
async function uploadRepo(req, res, next) {
    try {
        const file = req.file;
        if (!file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        // Extract zip to temp directory
        const tempDir = path.join(require('os').tmpdir(), 'codebase-explainer', path.parse(file.originalname).name);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        // Since we accept a folder path directly (or zip), handle both
        const repo = await (0, repoService_1.processRepo)(file.originalname, file.path);
        res.status(201).json(repo);
    }
    catch (err) {
        next(err);
    }
}
async function scanPath(req, res, next) {
    try {
        const { repoPath, name } = req.body;
        if (!repoPath) {
            res.status(400).json({ error: 'repoPath is required' });
            return;
        }
        const resolvedPath = path.resolve(repoPath);
        if (!fs.existsSync(resolvedPath)) {
            res.status(404).json({ error: `Path not found: ${resolvedPath}` });
            return;
        }
        if (!fs.statSync(resolvedPath).isDirectory()) {
            res.status(400).json({ error: 'Path must be a directory' });
            return;
        }
        const repo = await (0, repoService_1.processRepo)(name || path.basename(resolvedPath), resolvedPath);
        res.status(201).json(repo);
    }
    catch (err) {
        next(err);
    }
}
async function getRepoById(req, res, next) {
    try {
        const { id } = req.params;
        const repo = (0, repoService_1.getRepo)(id);
        if (!repo) {
            res.status(404).json({ error: 'Repository not found' });
            return;
        }
        res.json(repo);
    }
    catch (err) {
        next(err);
    }
}
async function getRepoSummary(req, res, next) {
    try {
        const { id } = req.params;
        const summary = (0, repoService_1.getSummary)(id);
        if (!summary) {
            res.status(404).json({ error: 'Repository not found' });
            return;
        }
        res.json(summary);
    }
    catch (err) {
        next(err);
    }
}
async function listAllRepos(_req, res, next) {
    try {
        const repos = (0, repoService_1.listRepos)();
        res.json(repos);
    }
    catch (err) {
        next(err);
    }
}
async function getRepoFiles(req, res, next) {
    try {
        const { id } = req.params;
        const repo = (0, repoService_1.getRepo)(id);
        if (!repo) {
            res.status(404).json({ error: 'Repository not found' });
            return;
        }
        const fileList = repo.files.map(f => ({
            id: f.id,
            path: f.path,
            language: f.language,
            summary: f.summary,
        }));
        res.json(fileList);
    }
    catch (err) {
        next(err);
    }
}
async function getFileContent(req, res, next) {
    try {
        const { id } = req.params;
        const filePath = req.params[0];
        if (!filePath) {
            res.status(400).json({ error: 'File path is required' });
            return;
        }
        const repo = (0, repoService_1.getRepo)(id);
        if (!repo) {
            res.status(404).json({ error: 'Repository not found' });
            return;
        }
        const file = repo.files.find(f => f.path === filePath);
        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }
        res.type('text/plain').send(file.content);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=repoController.js.map