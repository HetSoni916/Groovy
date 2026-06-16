import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Document, Page, PdfUploadResponse } from '../types';
import { storage } from '../utils/storage';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config';

export class PdfService {
  async parsePdf(filePath: string, filename: string): Promise<PdfUploadResponse> {
    if (!fs.existsSync(filePath)) {
      throw new AppError('File not found', 404);
    }

    const buffer = fs.readFileSync(filePath);
    if (buffer.length === 0) {
      throw new AppError('Empty PDF file', 400);
    }

    let data: any;
    try {
      const pdfParse = require('pdf-parse');
      data = await pdfParse(buffer);
    } catch (err: any) {
      throw new AppError(`Failed to parse PDF: ${err.message}`, 400);
    }

    if (!data.text || data.text.trim().length === 0) {
      throw new AppError('PDF contains no extractable text', 400);
    }

    const totalPages = data.numpages || 1;
    const text = data.text;
    const words = text.split(/\s+/).filter((w: string) => w.length > 0).length;

    const doc: Document = {
      id: uuidv4(),
      filename,
      totalPages,
      totalWords: words,
      uploadedAt: new Date().toISOString(),
      filePath,
    };

    const pages = this.extractPages(text, totalPages, doc.id);
    storage.saveDocument(doc);
    storage.savePages(pages);

    return { document: doc, pages: totalPages, words };
  }

  private extractPages(text: string, totalPages: number, documentId: string): (Page & { documentId: string })[] {
    const pages: (Page & { documentId: string })[] = [];
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

  private splitByPages(text: string, totalPages: number): string[] {
    if (totalPages <= 1) return [text];

    const lines = text.split('\n');
    const pageTexts: string[] = [];
    let currentPage: string[] = [];
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
        if (afterBreak.trim()) currentPage.push(afterBreak);
      } else {
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

  async deleteDocument(id: string): Promise<void> {
    const doc = storage.getDocument(id);
    if (!doc) throw new AppError('Document not found', 404);

    if (fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }
    storage.deleteDocument(id);
  }
}

export const pdfService = new PdfService();
