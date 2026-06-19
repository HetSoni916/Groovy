import { z } from 'zod';
export declare const QueryRequestSchema: z.ZodObject<{
    question: z.ZodString;
    documentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const PdfUploadSchema: z.ZodObject<{
    file: z.ZodCustom<Object, Object>;
}, z.core.$strip>;
export declare const DeletePdfParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export type QueryRequest = z.infer<typeof QueryRequestSchema>;
export type PdfUploadInput = z.infer<typeof PdfUploadSchema>;
export type DeletePdfParams = z.infer<typeof DeletePdfParamsSchema>;
export declare function queryRequestToToolSpec(): {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                question: {
                    type: string;
                    description: string;
                };
                documentIds: {
                    type: string;
                    items: {
                        type: string;
                        format: string;
                    };
                    description: string;
                };
            };
            required: string[];
        };
    };
};
//# sourceMappingURL=index.d.ts.map