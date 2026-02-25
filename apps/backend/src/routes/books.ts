import { Router } from 'express';
import { prisma } from '@aspire/db';
import { BookStatus, Role } from '@aspire/db';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth.js';
import { createBookSchema, updateBookSchema } from '../validation/books.js';
import { auditLog } from '../lib/audit.js';

export const booksRouter = Router();

booksRouter.get('/', async (req, res, next) => {
  try {
    const { q, title, author, tag, status } = req.query as Record<string, string | undefined>;
    const where: Record<string, unknown> = { archivedAt: null };

    if (status) {
      where.status = status as BookStatus;
    }
    if (title) {
      where.title = { contains: title, mode: 'insensitive' as const };
    }
    if (author) {
      where.author = { contains: author, mode: 'insensitive' as const };
    }
    if (tag) {
      where.tags = { has: tag };
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' as const } },
        { author: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
      ];
    }

    const books = await prisma.book.findMany({
      where,
      orderBy: { title: 'asc' },
    });
    res.json(books);
  } catch (e) {
    next(e);
  }
});

booksRouter.get('/:id', async (req, res, next) => {
  try {
    const book = await prisma.book.findFirst({
      where: { id: req.params.id, archivedAt: null },
    });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (e) {
    next(e);
  }
});

booksRouter.post(
  '/',
  requireAuth,
  requireRole(Role.ADMIN, Role.LIBRARIAN),
  async (req: AuthRequest, res, next) => {
    try {
      const parsed = createBookSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const data = parsed.data;
      const book = await prisma.book.create({
        data: {
          title: data.title,
          author: data.author,
          isbn: data.isbn,
          description: data.description,
          imageUrl: data.imageUrl ?? undefined,
          tags: data.tags ?? [],
        },
      });
      if (req.userId) await auditLog(req.userId, 'BOOK_CREATE', 'Book', book.id, { title: book.title });
      res.status(201).json(book);
    } catch (e) {
      next(e);
    }
  }
);

booksRouter.patch(
  '/:id',
  requireAuth,
  requireRole(Role.ADMIN, Role.LIBRARIAN),
  async (req: AuthRequest, res, next) => {
    try {
      const parsed = updateBookSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const existing = await prisma.book.findFirst({
        where: { id: req.params.id, archivedAt: null },
      });
      if (!existing) return res.status(404).json({ error: 'Book not found' });
      const book = await prisma.book.update({
        where: { id: req.params.id },
        data: {
          ...(parsed.data.title !== undefined && { title: parsed.data.title }),
          ...(parsed.data.author !== undefined && { author: parsed.data.author }),
          ...(parsed.data.isbn !== undefined && { isbn: parsed.data.isbn }),
          ...(parsed.data.description !== undefined && { description: parsed.data.description }),
          ...(parsed.data.imageUrl !== undefined && { imageUrl: parsed.data.imageUrl }),
          ...(parsed.data.tags !== undefined && { tags: parsed.data.tags }),
          ...(parsed.data.status !== undefined && { status: parsed.data.status }),
        },
      });
      if (req.userId) await auditLog(req.userId, 'BOOK_UPDATE', 'Book', book.id, { title: book.title });
      res.json(book);
    } catch (e) {
      next(e);
    }
  }
);

booksRouter.delete(
  '/:id',
  requireAuth,
  requireRole(Role.ADMIN, Role.LIBRARIAN),
  async (req: AuthRequest, res, next) => {
    try {
      const existing = await prisma.book.findFirst({
        where: { id: req.params.id, archivedAt: null },
      });
      if (!existing) return res.status(404).json({ error: 'Book not found' });
      const now = new Date();
      await prisma.book.update({
        where: { id: req.params.id },
        data: { archivedAt: now, status: BookStatus.ARCHIVED },
      });
      if (req.userId) await auditLog(req.userId, 'BOOK_DELETE', 'Book', req.params.id, { title: existing.title });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);
