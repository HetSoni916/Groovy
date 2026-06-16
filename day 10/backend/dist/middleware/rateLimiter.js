"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = rateLimiter;
const config_1 = require("../config");
const clients = new Map();
function rateLimiter(req, res, next) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let entry = clients.get(ip);
    if (!entry || now - entry.windowStart > config_1.config.rateLimitWindow) {
        entry = { count: 0, windowStart: now };
        clients.set(ip, entry);
    }
    entry.count++;
    res.setHeader('X-RateLimit-Limit', config_1.config.rateLimitMax);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config_1.config.rateLimitMax - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil((entry.windowStart + config_1.config.rateLimitWindow) / 1000));
    if (entry.count > config_1.config.rateLimitMax) {
        res.status(429).json({
            error: 'Too many requests',
            message: `Rate limit exceeded. Max ${config_1.config.rateLimitMax} requests per ${config_1.config.rateLimitWindow / 1000}s.`,
            retryAfter: Math.ceil((entry.windowStart + config_1.config.rateLimitWindow - now) / 1000),
        });
        return;
    }
    next();
}
// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of clients) {
        if (now - entry.windowStart > config_1.config.rateLimitWindow * 2) {
            clients.delete(ip);
        }
    }
}, 60000);
//# sourceMappingURL=rateLimiter.js.map