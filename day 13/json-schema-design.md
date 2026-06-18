# JSON Schema Design

## What is JSON Schema

JSON Schema is a vocabulary that annotates and validates JSON documents. It's the standard used by OpenAI/Anthropic tool specs for parameter definitions.

## Core Keywords

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "name":        { "type": "string" },
    "age":         { "type": "integer", "minimum": 0 },
    "email":       { "type": "string", "format": "email" },
    "role":        { "type": "string", "enum": ["admin", "user"] },
    "tags":        { "type": "array", "items": { "type": "string" } },
    "metadata":    { "type": "object" },
    "isActive":    { "type": "boolean" }
  },
  "required": ["name", "email"]
}
```

## Our Current Types vs JSON Schema

Our `src/types/index.ts` uses TypeScript interfaces:

```ts
interface QueryRequest {
  question: string;
  documentIds?: string[];
}
```

The equivalent JSON Schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "question": {
      "type": "string",
      "description": "The user's question",
      "minLength": 1,
      "maxLength": 1000
    },
    "documentIds": {
      "type": "array",
      "items": { "type": "string", "format": "uuid" },
      "description": "Filter to specific documents"
    }
  },
  "required": ["question"]
}
```

## Designing Schemas for Our API

### QueryRequest (POST /api/chat)

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| question | string | Yes | 1–1000 chars |
| documentIds | string[] | No | UUID format, max 20 |

### PdfUpload (multipart)

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| file | binary | Yes | max 50MB, .pdf |
| documentId (query param) | string | No | UUID format |

### QueryResponse (response)

| Field | Type | Description |
|-------|------|-------------|
| answer | string | LLM-generated answer |
| sources | Source[] | Source documents |
| chunks | ChunkResult[] | Retrieved chunks with scores |
| usage | TokenUsage | Token + cost tracking |

## Using Zod for Runtime Validation

Zod lets us define schemas in TypeScript and get both **type safety** and **runtime validation**:

```ts
import { z } from 'zod';

const QueryRequestSchema = z.object({
  question: z.string().min(1).max(1000),
  documentIds: z.array(z.string().uuid()).max(20).optional(),
});

type QueryRequest = z.infer<typeof QueryRequestSchema>;
```

One definition → TypeScript type + runtime validator + tool spec parameters.

## Validation Middleware Pattern

```ts
function validate(schema: z.ZodSchema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues,
      });
    }
    req.body = result.data;
    next();
  };
}
```

## Hierarchy of Schema Usage

```
JSON Schema (raw spec)
      ↕ converts to
Zod Schema (TypeScript-native)
      ↕ infers
TypeScript Type (compile-time)
      ↕ validates
Runtime Check (request validation)
```

This way, changes flow in one direction: define in Zod → get types + validation for free.
