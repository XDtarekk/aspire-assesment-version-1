"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const google_auth_library_1 = require("google-auth-library");
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("@aspire/db");
const db_2 = require("@aspire/db");
const auth_js_1 = require("../middleware/auth.js");
const auth_js_2 = require("../validation/auth.js");
exports.authRouter = (0, express_1.Router)();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const SALT_ROUNDS = 10;
async function verifyGoogleIdToken(idToken) {
    if (!GOOGLE_CLIENT_ID)
        throw new Error('Google auth not configured');
    const client = new google_auth_library_1.OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email)
        throw new Error('Invalid Google token');
    return { email: payload.email, name: payload.name ?? undefined };
}
exports.authRouter.post('/google', async (req, res, next) => {
    try {
        const parsed = auth_js_2.googleAuthSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.flatten() });
        const { email, name } = await verifyGoogleIdToken(parsed.data.idToken);
        const user = await db_1.prisma.user.upsert({
            where: { email },
            update: { name: name ?? undefined },
            create: { email, name: name ?? undefined, role: db_2.Role.MEMBER },
        });
        const token = (0, auth_js_1.signToken)(user.id, user.role);
        res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    }
    catch (e) {
        if (e instanceof Error && e.message.includes('Invalid'))
            return res.status(401).json({ error: e.message });
        next(e);
    }
});
exports.authRouter.post('/login', async (req, res, next) => {
    try {
        const parsed = auth_js_2.loginSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.flatten() });
        const { email, password } = parsed.data;
        const user = await db_1.prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash)
            return res.status(401).json({ error: 'Invalid email or password' });
        const ok = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!ok)
            return res.status(401).json({ error: 'Invalid email or password' });
        const token = (0, auth_js_1.signToken)(user.id, user.role);
        res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    }
    catch (e) {
        next(e);
    }
});
exports.authRouter.patch('/users/:id/password', auth_js_1.requireAuth, (0, auth_js_1.requireRole)(db_2.Role.ADMIN), async (req, res, next) => {
    try {
        const parsed = auth_js_2.setPasswordSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.flatten() });
        const hash = await bcrypt_1.default.hash(parsed.data.password, SALT_ROUNDS);
        const user = await db_1.prisma.user.update({
            where: { id: req.params.id },
            data: { passwordHash: hash },
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
