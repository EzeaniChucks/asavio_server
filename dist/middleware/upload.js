"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadVideo = exports.upload = void 0;
// src/middleware/upload.ts
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const AppError_1 = require("../utils/AppError");
// Memory storage — no temp directory needed; files are in file.buffer
const storage = multer_1.default.memoryStorage();
const imageFileFilter = (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const isValid = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase()) &&
        allowedTypes.test(file.mimetype);
    if (isValid) {
        cb(null, true);
    }
    else {
        cb(new AppError_1.AppError("Only image files (jpeg, jpg, png, webp) are allowed", 400));
    }
};
const videoFileFilter = (_req, file, cb) => {
    const allowedExts = /mp4|mov|m4v/;
    const allowedMimes = /video\/(mp4|quicktime|x-m4v)/;
    const extValid = allowedExts.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimeValid = allowedMimes.test(file.mimetype);
    if (extValid && mimeValid) {
        cb(null, true);
    }
    else {
        cb(new AppError_1.AppError("Only video files (mp4, mov) are allowed", 400));
    }
};
/** For property/vehicle image uploads — 5 MB per file */
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFileFilter,
});
/** For feature video uploads — 100 MB max (Elite limit; enforced further in controller) */
exports.uploadVideo = (0, multer_1.default)({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: videoFileFilter,
});
//# sourceMappingURL=upload.js.map