"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const db_1 = require("@aspire/db");
const auth_js_1 = require("../middleware/auth.js");
const upload_js_1 = require("../config/upload.js");
exports.uploadRouter = (0, express_1.Router)();
exports.uploadRouter.post('/', auth_js_1.requireAuth, (0, auth_js_1.requireRole)(db_1.Role.ADMIN, db_1.Role.LIBRARIAN), (req, res) => {
    upload_js_1.uploadImage.single('image')(req, res, (err) => {
        if (err) {
            if (err instanceof multer_1.default.MulterError && err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File too large (max 5MB).' });
            }
            return res.status(400).json({ error: err instanceof Error ? err.message : 'Upload failed' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded. Use field name "image".' });
        }
        const imageUrl = `/uploads/${req.file.filename}`;
        res.status(201).json({ imageUrl });
    });
});
