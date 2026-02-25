"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBookSchema = exports.createBookSchema = void 0;
const zod_1 = require("zod");
const db_1 = require("@aspire/db");
exports.createBookSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    author: zod_1.z.string().min(1),
    isbn: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    imageUrl: zod_1.z.union([zod_1.z.string().url(), zod_1.z.string().startsWith('/')]).optional().nullable(),
    tags: zod_1.z.array(zod_1.z.string()).optional().default([]),
});
exports.updateBookSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    author: zod_1.z.string().min(1).optional(),
    isbn: zod_1.z.string().optional().nullable(),
    description: zod_1.z.string().optional().nullable(),
    imageUrl: zod_1.z.union([zod_1.z.string().url(), zod_1.z.string().startsWith('/')]).optional().nullable(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    status: zod_1.z.nativeEnum(db_1.BookStatus).optional(),
});
