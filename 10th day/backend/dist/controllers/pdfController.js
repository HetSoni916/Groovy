"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPdf = uploadPdf;
exports.listPdfs = listPdfs;
exports.deletePdf = deletePdf;
const pdfParser_1 = require("../services/pdfParser");
const chunker_1 = require("../services/chunker");
const vectorStore_1 = require("../services/vectorStore");
const storage_1 = require("../utils/storage");
async function uploadPdf(req, res, next) {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        const result = await pdfParser_1.pdfService.parsePdf(req.file.path, req.file.originalname);
        const pages = storage_1.storage.getPages(result.document.id);
        await chunker_1.chunkerService.chunkPages(result.document.id, pages);
        res.status(201).json(result);
    }
    catch (err) {
        next(err);
    }
}
async function listPdfs(_req, res, next) {
    try {
        const docs = storage_1.storage.getDocuments();
        res.json(docs);
    }
    catch (err) {
        next(err);
    }
}
async function deletePdf(req, res, next) {
    try {
        const { id } = req.params;
        await pdfParser_1.pdfService.deleteDocument(id);
        await vectorStore_1.vectorStore.deleteDocument(id);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=pdfController.js.map