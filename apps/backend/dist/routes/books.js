"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.booksRouter = void 0;
const express_1 = require("express");
const db_1 = require("@aspire/db");
const db_2 = require("@aspire/db");
const auth_js_1 = require("../middleware/auth.js");
const books_js_1 = require("../validation/books.js");
const audit_js_1 = require("../lib/audit.js");
exports.booksRouter = (0, express_1.Router)();
exports.booksRouter.get('/', async (req, res, next) => {
    try {
        const { q, title, author, tag, status } = req.query;
        const where = { archivedAt: null };
        if (status) {
            where.status = status;
        }
        if (title) {
            where.title = { contains: title, mode: 'insensitive' };
        }
        if (author) {
            where.author = { contains: author, mode: 'insensitive' };
        }
        if (tag) {
            where.tags = { has: tag };
        }
        if (q) {
            where.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { author: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
            ];
        }
        const books = await db_1.prisma.book.findMany({
            where,
            orderBy: { title: 'asc' },
        });
        res.json(books);
    }
    catch (e) {
        next(e);
    }
});
exports.booksRouter.get('/:id', async (req, res, next) => {
    try {
        const book = await db_1.prisma.book.findFirst({
            where: { id: req.params.id, archivedAt: null },
        });
        if (!book)
            return res.status(404).json({ error: 'Book not found' });
        res.json(book);
    }
    catch (e) {
        next(e);
    }
});
exports.booksRouter.post('/', auth_js_1.requireAuth, (0, auth_js_1.requireRole)(db_2.Role.ADMIN, db_2.Role.LIBRARIAN), async (req, res, next) => {
    try {
        const parsed = books_js_1.createBookSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.flatten() });
        const data = parsed.data;
        const book = await db_1.prisma.book.create({
            data: {
                title: data.title,
                author: data.author,
                isbn: data.isbn,
                description: data.description,
                imageUrl: data.imageUrl ?? undefined,
                tags: data.tags ?? [],
            },
        });
        if (req.userId)
            await (0, audit_js_1.auditLog)(req.userId, 'BOOK_CREATE', 'Book', book.id, { title: book.title });
        res.status(201).json(book);
    }
    catch (e) {
        next(e);
    }
});
exports.booksRouter.patch('/:id', auth_js_1.requireAuth, (0, auth_js_1.requireRole)(db_2.Role.ADMIN, db_2.Role.LIBRARIAN), async (req, res, next) => {
    try {
        const parsed = books_js_1.updateBookSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.flatten() });
        const existing = await db_1.prisma.book.findFirst({
            where: { id: req.params.id, archivedAt: null },
        });
        if (!existing)
            return res.status(404).json({ error: 'Book not found' });
        const book = await db_1.prisma.book.update({
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
        if (req.userId)
            await (0, audit_js_1.auditLog)(req.userId, 'BOOK_UPDATE', 'Book', book.id, { title: book.title });
        res.json(book);
    }
    catch (e) {
        next(e);
    }
});
exports.booksRouter.delete('/:id', auth_js_1.requireAuth, (0, auth_js_1.requireRole)(db_2.Role.ADMIN, db_2.Role.LIBRARIAN), async (req, res, next) => {
    try {
        const existing = await db_1.prisma.book.findFirst({
            where: { id: req.params.id, archivedAt: null },
        });
        if (!existing)
            return res.status(404).json({ error: 'Book not found' });
        const now = new Date();
        await db_1.prisma.book.update({
            where: { id: req.params.id },
            data: { archivedAt: now, status: db_2.BookStatus.ARCHIVED },
        });
        if (req.userId)
            await (0, audit_js_1.auditLog)(req.userId, 'BOOK_DELETE', 'Book', req.params.id, { title: existing.title });
        res.status(204).send();
    }
    catch (e) {
        next(e);
    }
});
