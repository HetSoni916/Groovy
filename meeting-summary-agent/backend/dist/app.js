"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const routes_1 = __importDefault(require("./routes"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: env_1.env.CORS_ORIGIN }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api', routes_1.default);
const frontendDist = path_1.default.resolve(__dirname, '../../frontend/dist');
app.use(express_1.default.static(frontendDist));
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(frontendDist, 'index.html'));
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map