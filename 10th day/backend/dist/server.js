"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const port = config_1.config.port;
app_1.default.listen(port, () => {
    console.log(`Ask My Notes API running on http://localhost:${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
});
//# sourceMappingURL=server.js.map