"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.avatarMulterOptions = void 0;
const fs_1 = require("fs");
const multer_1 = require("multer");
const path_1 = require("path");
const uuid_1 = require("uuid");
const avatarUploadDir = (0, path_1.join)(process.cwd(), 'uploads', 'avatars');
exports.avatarMulterOptions = {
    storage: (0, multer_1.diskStorage)({
        destination: (req, file, callback) => {
            if (!(0, fs_1.existsSync)(avatarUploadDir)) {
                (0, fs_1.mkdirSync)(avatarUploadDir, { recursive: true });
            }
            callback(null, avatarUploadDir);
        },
        filename: (req, file, callback) => {
            callback(null, `${(0, uuid_1.v4)()}${(0, path_1.extname)(file.originalname)}`);
        },
    }),
    fileFilter: (req, file, callback) => {
        if (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)) {
            callback(null, true);
            return;
        }
        callback(new Error('Invalid avatar file type'), false);
    },
    limits: {
        fileSize: 2 * 1024 * 1024,
    },
};
//# sourceMappingURL=avatar-multer.config.js.map