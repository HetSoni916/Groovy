"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const config_1 = require("../config");
const errorHandler_1 = require("./errorHandler");
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, config_1.config.storageDir);
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${(0, uuid_1.v4)()}${ext}`);
    },
});
function fileFilter(_req, file, cb) {
    if (file.mimetype !== 'application/pdf') {
        return cb(new errorHandler_1.AppError('Only PDF files are allowed', 400));
    }
    if (path_1.default.extname(file.originalname).toLowerCase() !== '.pdf') {
        return cb(new errorHandler_1.AppError('File must have .pdf extension', 400));
    }
    cb(null, true);
}
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: config_1.config.maxFileSize },
});
//# sourceMappingURL=upload.js.map