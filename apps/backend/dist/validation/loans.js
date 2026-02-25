"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnSchema = exports.checkoutSchema = void 0;
const zod_1 = require("zod");
exports.checkoutSchema = zod_1.z.object({
    bookId: zod_1.z.string().uuid(),
});
exports.returnSchema = zod_1.z.object({
    loanId: zod_1.z.string().uuid(),
});
