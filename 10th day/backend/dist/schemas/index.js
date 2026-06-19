"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeletePdfParamsSchema = exports.PdfUploadSchema = exports.QueryRequestSchema = void 0;
exports.queryRequestToToolSpec = queryRequestToToolSpec;
const zod_1 = require("zod");
exports.QueryRequestSchema = zod_1.z.object({
    question: zod_1.z
        .string()
        .min(1, 'Question is required')
        .max(2000, 'Question must be under 2000 characters'),
    documentIds: zod_1.z
        .array(zod_1.z.string().uuid('Invalid document ID format'))
        .max(20, 'Maximum 20 document IDs')
        .optional(),
});
exports.PdfUploadSchema = zod_1.z.object({
    file: zod_1.z
        .instanceof(Object)
        .refine((v) => v?.mimetype === 'application/pdf', {
        message: 'File must be a PDF',
    })
        .refine((v) => v?.size <= 50 * 1024 * 1024, {
        message: 'File must be under 50MB',
    }),
});
exports.DeletePdfParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid document ID format'),
});
function queryRequestToToolSpec() {
    return {
        type: 'function',
        function: {
            name: 'search_notes',
            description: 'Search the user\'s uploaded PDF notes for relevant information. Use this when the user asks a question about their documents.',
            parameters: {
                type: 'object',
                properties: {
                    question: {
                        type: 'string',
                        description: 'The user\'s question to search for in their notes',
                    },
                    documentIds: {
                        type: 'array',
                        items: { type: 'string', format: 'uuid' },
                        description: 'Optional: restrict search to specific document IDs',
                    },
                },
                required: ['question'],
            },
        },
    };
}
//# sourceMappingURL=index.js.map