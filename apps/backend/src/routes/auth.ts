import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcrypt';
import { prisma } from '@aspire/db';
import { Role } from '@aspire/db';
import { signToken, requireAuth, requireRole, type AuthRequest } from '../middleware/auth.js';
import { googleAuthSchema, loginSchema, setPasswordSchema } from '../validation/auth.js';

export const authRouter = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const SALT_ROUNDS = 10;

async function verifyGoogleIdToken(idToken: string): Promise<{ email: string; name?: string }> {
  if (!GOOGLE_CLIENT_ID) throw new Error('Google auth not configured');
  const client = new OAuth2Client(GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload?.email) throw new Error('Invalid Google token');
  return { email: payload.email, name: payload.name ?? undefined };
}

authRouter.post('/google', async (req, res, next) => {
  try {
    const parsed = googleAuthSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { email, name } = await verifyGoogleIdToken(parsed.data.idToken);
    const user = await prisma.user.upsert({
      where: { email },
      update: { name: name ?? undefined },
      create: { email, name: name ?? undefined, role: Role.MEMBER },
    });
    const token = signToken(user.id, user.role);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    if (e instanceof Error && e.message.includes('Invalid')) return res.status(401).json({ error: e.message });
    next(e);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) return res.status(401).json({ error: 'Invalid email or password' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
    const token = signToken(user.id, user.role);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    next(e);
  }
});

authRouter.patch(
  '/users/:id/password',
  requireAuth,
  requireRole(Role.ADMIN),
  async (req: AuthRequest, res, next) => {
    try {
      const parsed = setPasswordSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const hash = await bcrypt.hash(parsed.data.password, SALT_ROUNDS);
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { passwordHash: hash },
        select: { id: true, email: true, name: true, role: true },
      });
      res.json(user);
    } catch (e) {
      if ((e as { code?: string }).code === 'P2025') return res.status(404).json({ error: 'User not found' });
      next(e);
    }
  }
);
