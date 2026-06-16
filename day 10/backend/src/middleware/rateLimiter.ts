import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const clients = new Map<string, RateLimitEntry>();

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  let entry = clients.get(ip);

  if (!entry || now - entry.windowStart > config.rateLimitWindow) {
    entry = { count: 0, windowStart: now };
    clients.set(ip, entry);
  }

  entry.count++;

  res.setHeader('X-RateLimit-Limit', config.rateLimitMax);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, config.rateLimitMax - entry.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil((entry.windowStart + config.rateLimitWindow) / 1000));

  if (entry.count > config.rateLimitMax) {
    res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Max ${config.rateLimitMax} requests per ${config.rateLimitWindow / 1000}s.`,
      retryAfter: Math.ceil((entry.windowStart + config.rateLimitWindow - now) / 1000),
    });
    return;
  }

  next();
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of clients) {
    if (now - entry.windowStart > config.rateLimitWindow * 2) {
      clients.delete(ip);
    }
  }
}, 60000);
