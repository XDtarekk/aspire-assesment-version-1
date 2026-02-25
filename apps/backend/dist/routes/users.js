"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const db_1 = require("@aspire/db");
const db_2 = require("@aspire/db");
const auth_js_1 = require("../middleware/auth.js");
const users_js_1 = require("../validation/users.js");
exports.usersRouter = (0, express_1.Router)();
exports.usersRouter.get('/', auth_js_1.requireAuth, (0, auth_js_1.requireRole)(db_2.Role.ADMIN), async (_req, res, next) => {
    try {
        const users = await db_1.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: { id: true, email: true, name: true, role: true, createdAt: true },
        });
        res.json(users);
    }
    catch (e) {
        next(e);
    }
});
exports.usersRouter.patch('/:id/role', auth_js_1.requireAuth, (0, auth_js_1.requireRole)(db_2.Role.ADMIN), async (req, res, next) => {
    try {
        const parsed = users_js_1.updateRoleSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.flatten() });
        const user = await db_1.prisma.user.update({
            where: { id: req.params.id },
            data: { role: parsed.data.role },
            select: { id: true, email: true, name: true, role: true },
        });
        res.json(user);
    }
    catch (e) {
        if (e.code === 'P2025')
            return res.status(404).json({ error: 'User not found' });
        next(e);
    }
});
