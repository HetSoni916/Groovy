import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = (result.error as ZodError).issues.map(i => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      res.status(400).json({ error: 'Validation failed', details: issues });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const issues = (result.error as ZodError).issues.map(i => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      res.status(400).json({ error: 'Validation failed', details: issues });
      return;
    }
    next();
  };
}
