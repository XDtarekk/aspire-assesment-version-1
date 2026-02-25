"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = auditLog;
const db_1 = require("@aspire/db");
async function auditLog(actorId, action, entityType, entityId, metadata = {}) {
    await db_1.prisma.auditLog.create({
        data: { actorId, action, entityType, entityId, metadata: metadata },
    });
}
