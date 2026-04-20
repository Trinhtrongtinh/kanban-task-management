"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multerOptions = exports.fileFilter = exports.multerStorage = exports.MAX_FILE_SIZE = exports.ALLOWED_FILE_TYPES = void 0;
const multer_1 = require("multer");
const path_1 = require("path");
const uuid_1 = require("uuid");
exports.ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed',
];
exports.MAX_FILE_SIZE = 5 * 1024 * 1024;
exports.multerStorage = (0, multer_1.diskStorage)({
    destination: './uploads/attachments',
    filename: (req, file, callback) => {
        const uniqueName = `${(0, uuid_1.v4)()}${(0, path_1.extname)(file.originalname)}`;
        callback(null, uniqueName);
    },
});
const fileFilter = (req, file, callback) => {
    if (exports.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
        callback(null, true);
    }
    else {
        callback(new Error('Invalid file type'), false);
    }
};
exports.fileFilter = fileFilter;
exports.multerOptions = {
    storage: exports.multerStorage,
    fileFilter: exports.fileFilter,
    limits: {
        fileSize: exports.MAX_FILE_SIZE,
    },
};
//# sourceMappingURL=multer.config.js.map