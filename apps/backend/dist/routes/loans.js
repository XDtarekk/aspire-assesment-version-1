"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loansRouter = void 0;
const express_1 = require("express");
const db_1 = require("@aspire/db");
const db_2 = require("@aspire/db");
const auth_js_1 = require("../middleware/auth.js");
const loans_js_1 = require("../validation/loans.js");
const audit_js_1 = require("../lib/audit.js");
exports.loansRouter = (0, express_1.Router)();
const DUE_DAYS = 14;
function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}
exports.loansRouter.post('/checkout', auth_js_1.requireAuth, async (req, res, next) => {
    try {
        const parsed = loans_js_1.checkoutSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.flatten() });
        const { bookId } = parsed.data;
        const userId = req.userId;
        const result = await db_1.prisma.$transaction(async (tx) => {
            const book = await tx.book.findFirst({
                where: { id: bookId, archivedAt: null },
            });
            if (!book)
                throw Object.assign(new Error('Book not found'), { status: 404 });
            if (book.status !== db_2.BookStatus.AVAILABLE) {
                throw Object.assign(new Error('Book is not available'), { status: 400 });
            }
            const dueAt = addDays(new Date(), DUE_DAYS);
            const loan = await tx.loan.create({
                data: { bookId, userId, dueAt },
            });
            await tx.book.update({
                where: { id: bookId },
                data: { status: db_2.BookStatus.CHECKED_OUT },
            });
            return { loan, book };
        });
        await (0, audit_js_1.auditLog)(userId, 'LOAN_CHECKOUT', 'Loan', result.loan.id, {
            bookId,
            bookTitle: result.book.title,
        });
        res.status(201).json(result.loan);
    }
    catch (e) {
        next(e);
    }
});
exports.loansRouter.post('/return', auth_js_1.requireAuth, async (req, res, next) => {
    try {
        const parsed = loans_js_1.returnSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.flatten() });
        const { loanId } = parsed.data;
        const userId = req.userId;
        const userRole = req.userRole;
        await db_1.prisma.$transaction(async (tx) => {
            const loan = await tx.loan.findUnique({
                where: { id: loanId },
                include: { book: true },
            });
            if (!loan)
                throw Object.assign(new Error('Loan not found'), { status: 404 });
            if (loan.returnedAt)
                throw Object.assign(new Error('Loan already returned'), { status: 400 });
            const canReturn = userRole === db_2.Role.ADMIN || userRole === db_2.Role.LIBRARIAN || loan.userId === userId;
            if (!canReturn)
                throw Object.assign(new Error('Forbidden'), { status: 403 });
            await tx.loan.update({
                where: { id: loanId },
                data: { returnedAt: new Date() },
            });
            await tx.book.update({
                where: { id: loan.bookId },
                data: { status: db_2.BookStatus.AVAILABLE },
            });
        });
        await (0, audit_js_1.auditLog)(userId, 'LOAN_RETURN', 'Loan', loanId, { loanId });
        res.status(204).send();
    }
    catch (e) {
        next(e);
    }
});
exports.loansRouter.get('/me', auth_js_1.requireAuth, async (req, res, next) => {
    try {
        const loans = await db_1.prisma.loan.findMany({
            where: { userId: req.userId },
            include: { book: true },
            orderBy: { checkedOutAt: 'desc' },
        });
        res.json(loans);
    }
    catch (e) {
        next(e);
    }
});
exports.loansRouter.get('/', auth_js_1.requireAuth, (0, auth_js_1.requireRole)(db_2.Role.ADMIN, db_2.Role.LIBRARIAN), async (_req, res, next) => {
    try {
        const loans = await db_1.prisma.loan.findMany({
            include: { book: true, user: true },
            orderBy: { checkedOutAt: 'desc' },
        });
        res.json(loans);
    }
    catch (e) {
        next(e);
    }
});
