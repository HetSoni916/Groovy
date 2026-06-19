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
exports.pdfService = exports.PdfService = void 0;
const fs = __importStar(require("fs"));
const uuid_1 = require("uuid");
const storage_1 = require("../utils/storage");
const errorHandler_1 = require("../middleware/errorHandler");
class PdfService {
    async parsePdf(filePath, filename) {
        if (!fs.existsSync(filePath)) {
            throw new errorHandler_1.AppError('File not found', 404);
        }
        const buffer = fs.readFileSync(filePath);
        if (buffer.length === 0) {
            throw new errorHandler_1.AppError('Empty PDF file', 400);
        }
        let data;
        try {
            const pdfParse = require('pdf-parse');
            data = await pdfParse(buffer);
        }
        catch (err) {
            throw new errorHandler_1.AppError(`Failed to parse PDF: ${err.message}`, 400);
        }
        if (!data.text || data.text.trim().length === 0) {
            throw new errorHandler_1.AppError('PDF contains no extractable text', 400);
        }
        const totalPages = data.numpages || 1;
        const text = data.text;
        const words = text.split(/\s+/).filter((w) => w.length > 0).length;
        const doc = {
            id: (0, uuid_1.v4)(),
            filename,
            totalPages,
            totalWords: words,
            uploadedAt: new Date().toISOString(),
            filePath,
        };
        const pages = this.extractPages(text, totalPages, doc.id);
        storage_1.storage.saveDocument(doc);
        storage_1.storage.savePages(pages);
        return { document: doc, pages: totalPages, words };
    }
    extractPages(text, totalPages, documentId) {
        const pages = [];
        const pageTexts = this.splitByPages(text, totalPages);
        for (let i = 0; i < totalPages; i++) {
            const pageText = pageTexts[i] || '';
            const wordCount = pageText.split(/\s+/).filter(w => w.length > 0).length;
            pages.push({
                documentId,
                pageNumber: i + 1,
                text: pageText.trim(),
                wordCount,
            });
        }
        return pages;
    }
    splitByPages(text, totalPages) {
        if (totalPages <= 1)
            return [text];
        const lines = text.split('\n');
        const pageTexts = [];
        let currentPage = [];
        let pageCount = 0;
        for (const line of lines) {
            const pageBreak = line.match(/^\f/);
            if (pageBreak) {
                if (currentPage.length > 0) {
                    pageTexts.push(currentPage.join('\n'));
                }
                currentPage = [];
                pageCount++;
                const afterBreak = line.replace(/^\f/, '');
                if (afterBreak.trim())
                    currentPage.push(afterBreak);
            }
            else {
                currentPage.push(line);
            }
        }
        if (currentPage.length > 0) {
            pageTexts.push(currentPage.join('\n'));
        }
        while (pageTexts.length < totalPages) {
            pageTexts.push('');
        }
        return pageTexts;
    }
    async deleteDocument(id) {
        const doc = storage_1.storage.getDocument(id);
        if (!doc)
            throw new errorHandler_1.AppError('Document not found', 404);
        if (fs.existsSync(doc.filePath)) {
            fs.unlinkSync(doc.filePath);
        }
        storage_1.storage.deleteDocument(id);
    }
}
exports.PdfService = PdfService;
exports.pdfService = new PdfService();
//# sourceMappingURL=pdfParser.js.map