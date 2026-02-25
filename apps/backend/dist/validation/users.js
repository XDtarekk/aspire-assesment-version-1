"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRoleSchema = void 0;
const zod_1 = require("zod");
const db_1 = require("@aspire/db");
exports.updateRoleSchema = zod_1.z.object({
    role: zod_1.z.nativeEnum(db_1.Role),
});
