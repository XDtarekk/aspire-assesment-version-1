"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichBookSchema = void 0;
const zod_1 = require("zod");
exports.enrichBookSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    author: zod_1.z.string().min(1),
});
