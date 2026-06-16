import { Request, Response, NextFunction } from 'express';
import { pdfService } from '../services/pdfParser';
import { chunkerService } from '../services/chunker';
import { storage } from '../utils/storage';

export async function uploadPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const result = await pdfService.parsePdf(req.file.path, req.file.originalname);
    const pages = storage.getPages(result.document.id);
    chunkerService.chunkPages(result.document.id, pages);

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listPdfs(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const docs = storage.getDocuments();
    res.json(docs);
  } catch (err) {
    next(err);
  }
}

export async function deletePdf(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await pdfService.deleteDocument(id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
