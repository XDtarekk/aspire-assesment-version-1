import { Router } from 'express';
import { prisma } from '@aspire/db';
import { Role } from '@aspire/db';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth.js';
import { updateRoleSchema } from '../validation/users.js';

export const usersRouter = Router();

usersRouter.get('/', requireAuth, requireRole(Role.ADMIN), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.json(users);
  } catch (e) {
    next(e);
  }
});

usersRouter.patch(
  '/:id/role',
  requireAuth,
  requireRole(Role.ADMIN),
  async (req: AuthRequest, res, next) => {
    try {
      const parsed = updateRoleSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { role: parsed.data.role },
        select: { id: true, email: true, name: true, role: true },
      });
      res.json(user);
    } catch (e) {
      if ((e as { code?: string }).code === 'P2025') return res.status(404).json({ error: 'User not found' });
      next(e);
    }
  }
);
