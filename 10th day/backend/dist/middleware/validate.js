"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.validateParams = validateParams;
function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const issues = result.error.issues.map(i => ({
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
function validateParams(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            const issues = result.error.issues.map(i => ({
                field: i.path.join('.'),
                message: i.message,
            }));
            res.status(400).json({ error: 'Validation failed', details: issues });
            return;
        }
        next();
    };
}
//# sourceMappingURL=validate.js.map