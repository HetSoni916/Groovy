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
exports.storage = exports.StorageService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_1 = require("../config");
class StorageService {
    constructor() {
        fs.mkdirSync(config_1.config.storageDir, { recursive: true });
        this.docsPath = path.join(config_1.config.storageDir, 'documents.json');
        this.pagesPath = path.join(config_1.config.storageDir, 'pages.json');
        this.chunksPath = path.join(config_1.config.storageDir, 'chunks.json');
        this.chatsPath = path.join(config_1.config.storageDir, 'chats.json');
        this.initFile(this.docsPath);
        this.initFile(this.pagesPath);
        this.initFile(this.chunksPath);
        this.initFile(this.chatsPath);
    }
    initFile(filePath) {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '[]', 'utf-8');
        }
    }
    read(filePath) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
        catch {
            return [];
        }
    }
    write(filePath, data) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
    saveDocument(doc) {
        const docs = this.read(this.docsPath);
        const idx = docs.findIndex(d => d.id === doc.id);
        if (idx >= 0)
            docs[idx] = doc;
        else
            docs.push(doc);
        this.write(this.docsPath, docs);
    }
    getDocuments() {
        return this.read(this.docsPath);
    }
    getDocument(id) {
        return this.read(this.docsPath).find(d => d.id === id);
    }
    deleteDocument(id) {
        const docs = this.read(this.docsPath).filter(d => d.id !== id);
        this.write(this.docsPath, docs);
        const pages = this.read(this.pagesPath).filter((p) => p.documentId !== id);
        this.write(this.pagesPath, pages);
        const chunks = this.read(this.chunksPath).filter((c) => c.documentId !== id);
        this.write(this.chunksPath, chunks);
    }
    savePage(page) {
        const pages = this.read(this.pagesPath);
        pages.push(page);
        this.write(this.pagesPath, pages);
    }
    savePages(pages) {
        const existing = this.read(this.pagesPath);
        this.write(this.pagesPath, [...existing, ...pages]);
    }
    getPages(documentId) {
        return this.read(this.pagesPath).filter(p => p.documentId === documentId);
    }
    getAllPages() {
        return this.read(this.pagesPath);
    }
    saveChunk(chunk) {
        const chunks = this.read(this.chunksPath);
        chunks.push(chunk);
        this.write(this.chunksPath, chunks);
    }
    saveChunks(chunks) {
        const existing = this.read(this.chunksPath);
        this.write(this.chunksPath, [...existing, ...chunks]);
    }
    getChunks(documentId) {
        const all = this.read(this.chunksPath);
        return documentId ? all.filter(c => c.documentId === documentId) : all;
    }
    saveChat(entry) {
        const chats = this.read(this.chatsPath);
        chats.push(entry);
        this.write(this.chatsPath, chats);
    }
    getChatHistory() {
        return this.read(this.chatsPath);
    }
    clearChatHistory() {
        this.write(this.chatsPath, []);
    }
}
exports.StorageService = StorageService;
exports.storage = new StorageService();
//# sourceMappingURL=storage.js.map