import { PdfUploadResponse } from '../types';
export declare class PdfService {
    parsePdf(filePath: string, filename: string): Promise<PdfUploadResponse>;
    private extractPages;
    private splitByPages;
    deleteDocument(id: string): Promise<void>;
}
export declare const pdfService: PdfService;
//# sourceMappingURL=pdfParser.d.ts.map