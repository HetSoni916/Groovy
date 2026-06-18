import { z } from 'zod';

export const QueryRequestSchema = z.object({
  question: z
    .string()
    .min(1, 'Question is required')
    .max(2000, 'Question must be under 2000 characters'),
  documentIds: z
    .array(z.string().uuid('Invalid document ID format'))
    .max(20, 'Maximum 20 document IDs')
    .optional(),
});

export const PdfUploadSchema = z.object({
  file: z
    .instanceof(Object)
    .refine((v: any) => v?.mimetype === 'application/pdf', {
      message: 'File must be a PDF',
    })
    .refine((v: any) => v?.size <= 50 * 1024 * 1024, {
      message: 'File must be under 50MB',
    }),
});

export const DeletePdfParamsSchema = z.object({
  id: z.string().uuid('Invalid document ID format'),
});

export type QueryRequest = z.infer<typeof QueryRequestSchema>;
export type PdfUploadInput = z.infer<typeof PdfUploadSchema>;
export type DeletePdfParams = z.infer<typeof DeletePdfParamsSchema>;

export function queryRequestToToolSpec() {
  return {
    type: 'function' as const,
    function: {
      name: 'search_notes',
      description:
        'Search the user\'s uploaded PDF notes for relevant information. Use this when the user asks a question about their documents.',
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
