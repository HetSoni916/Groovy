"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    console.error(`Error: ${err.message}`);
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Internal server error' : err.message;
    res.status(statusCode).json({ error: message });
}
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.AppError = AppError;
//# sourceMappingURL=errorHandler.js.map