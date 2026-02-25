"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPasswordSchema = exports.loginSchema = exports.googleAuthSchema = void 0;
const zod_1 = require("zod");
exports.googleAuthSchema = zod_1.z.object({
    idToken: zod_1.z.string().min(1),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.setPasswordSchema = zod_1.z.object({
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
});
