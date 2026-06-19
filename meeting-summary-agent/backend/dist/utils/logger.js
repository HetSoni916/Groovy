"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
function write(level, event, data = {}) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        event,
        ...data,
    };
    const output = JSON.stringify(entry);
    if (level === 'error') {
        console.error(output);
        return;
    }
    if (level === 'warn') {
        console.warn(output);
        return;
    }
    console.log(output);
}
exports.logger = {
    info(event, data = {}) {
        write('info', event, data);
    },
    warn(event, data = {}) {
        write('warn', event, data);
    },
    error(event, data = {}) {
        write('error', event, data);
    },
};
//# sourceMappingURL=logger.js.map