"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(error, _req, res, _next) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    const statusCode = /invalid transcript|more specific question|not found/i.test(message) ? 400 : 500;
    if (statusCode >= 500) {
        console.error('[error]', error);
    }
    res.status(statusCode).json({ error: message });
}
//# sourceMappingURL=errorHandler.js.map