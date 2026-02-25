import { Router } from 'express';
import { prisma } from '@aspire/db';
import { BookStatus, Role } from '@aspire/db';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth.js';
import { checkoutSchema, returnSchema } from '../validation/loans.js';
import { auditLog } from '../lib/audit.js';

export const loansRouter = Router();

const DUE_DAYS = 14;

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

loansRouter.post(
  '/checkout',
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const parsed = checkoutSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const { bookId } = parsed.data;
      const userId = req.userId!;

      const result = await prisma.$transaction(async (tx) => {
        const book = await tx.book.findFirst({
          where: { id: bookId, archivedAt: null },
        });
        if (!book) throw Object.assign(new Error('Book not found'), { status: 404 });
        if (book.status !== BookStatus.AVAILABLE) {
          throw Object.assign(new Error('Book is not available'), { status: 400 });
        }
        const dueAt = addDays(new Date(), DUE_DAYS);
        const loan = await tx.loan.create({
          data: { bookId, userId, dueAt },
        });
        await tx.book.update({
          where: { id: bookId },
          data: { status: BookStatus.CHECKED_OUT },
        });
        return { loan, book };
      });

      await auditLog(userId, 'LOAN_CHECKOUT', 'Loan', result.loan.id, {
        bookId,
        bookTitle: result.book.title,
      });
      res.status(201).json(result.loan);
    } catch (e) {
      next(e);
    }
  }
);

loansRouter.post(
  '/return',
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const parsed = returnSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const { loanId } = parsed.data;
      const userId = req.userId!;
      const userRole = req.userRole!;

      await prisma.$transaction(async (tx) => {
        const loan = await tx.loan.findUnique({
          where: { id: loanId },
          include: { book: true },
        });
        if (!loan) throw Object.assign(new Error('Loan not found'), { status: 404 });
        if (loan.returnedAt) throw Object.assign(new Error('Loan already returned'), { status: 400 });
        const canReturn = userRole === Role.ADMIN || userRole === Role.LIBRARIAN || loan.userId === userId;
        if (!canReturn) throw Object.assign(new Error('Forbidden'), { status: 403 });

        await tx.loan.update({
          where: { id: loanId },
          data: { returnedAt: new Date() },
        });
        await tx.book.update({
          where: { id: loan.bookId },
          data: { status: BookStatus.AVAILABLE },
        });
      });

      await auditLog(userId, 'LOAN_RETURN', 'Loan', loanId, { loanId });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

loansRouter.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const loans = await prisma.loan.findMany({
      where: { userId: req.userId! },
      include: { book: true },
      orderBy: { checkedOutAt: 'desc' },
    });
    res.json(loans);
  } catch (e) {
    next(e);
  }
});

loansRouter.get(
  '/',
  requireAuth,
  requireRole(Role.ADMIN, Role.LIBRARIAN),
  async (_req, res, next) => {
    try {
      const loans = await prisma.loan.findMany({
        include: { book: true, user: true },
        orderBy: { checkedOutAt: 'desc' },
      });
      res.json(loans);
    } catch (e) {
      next(e);
    }
  }
);
