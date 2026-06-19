import { NextFunction, Request, Response } from 'express';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const message = error instanceof Error ? error.message : 'Unexpected server error.';
  const statusCode = /invalid transcript|more specific question|not found/i.test(message) ? 400 : 500;

  if (statusCode >= 500) {
    console.error('[error]', error);
  }

  res.status(statusCode).json({ error: message });
}