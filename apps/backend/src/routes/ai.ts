import { Router } from 'express';
import { prisma } from '@aspire/db';
import { Role } from '@aspire/db';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth.js';
import { enrichBookSchema } from '../validation/ai.js';

export const aiRouter = Router();

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.AI_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const RECOMMENDATIONS_MAX = 2;

function stubEnrich(title: string, author: string): { description: string; tags: string[] } {
  return {
    description: `A book titled "${title}" by ${author}. Add a description or use AI when GEMINI_API_KEY is set.`,
    tags: ['fiction', 'general'],
  };
}

async function enrichWithGemini(title: string, author: string): Promise<{ description: string; tags: string[] }> {
  if (!GEMINI_KEY) return stubEnrich(title, author);

  const prompt = `You are a librarian. For the book titled "${title}" by ${author}, provide:
1. A short description (2-4 sentences) suitable for a library catalog.
2. A list of 3-6 topic/genre tags (lowercase, e.g. fiction, classic, romance, programming).

Reply with ONLY a valid JSON object, no other text, in this exact format:
{"description":"...","tags":["tag1","tag2",...]}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API ${res.status}: ${err}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return stubEnrich(title, author);

  try {
    const raw = text.replace(/```json?\s*|\s*```/g, '').trim();
    const parsed = JSON.parse(raw) as { description?: string; tags?: string[] };
    const description = typeof parsed.description === 'string' ? parsed.description : stubEnrich(title, author).description;
    const tags = Array.isArray(parsed.tags) ? parsed.tags.filter((t): t is string => typeof t === 'string').slice(0, 10) : ['fiction', 'general'];
    return { description, tags };
  } catch {
    return stubEnrich(title, author);
  }
}

aiRouter.post(
  '/enrich-book',
  requireAuth,
  requireRole(Role.ADMIN, Role.LIBRARIAN),
  async (req, res, next) => {
    try {
      const parsed = enrichBookSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const { title, author } = parsed.data;
      const result = await enrichWithGemini(title, author);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

/** GET /api/ai/recommendations - AI recommendations based on user's loan history (auth required) */
aiRouter.get('/recommendations', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    const loans = await prisma.loan.findMany({
      where: { userId },
      include: { book: true },
      orderBy: { checkedOutAt: 'desc' },
    });

    const borrowedBookIds = [...new Set(loans.map((l) => l.book.id))];
    const borrowedBooks = loans
      .filter((l, i, arr) => arr.findIndex((x) => x.book.id === l.book.id) === i)
      .map((l) => ({ id: l.book.id, title: l.book.title, author: l.book.author, tags: l.book.tags }));

    const catalog = await prisma.book.findMany({
      where: { archivedAt: null },
      select: { id: true, title: true, author: true, tags: true },
      orderBy: { title: 'asc' },
    });

    if (borrowedBooks.length === 0) {
      return res.json({ books: [], hasHistory: false });
    }

    if (!GEMINI_KEY) {
      const available = catalog.filter((b) => !borrowedBookIds.includes(b.id));
      const shuffled = available.sort(() => Math.random() - 0.5);
      const ids = shuffled.slice(0, RECOMMENDATIONS_MAX).map((b) => b.id);
      const books = await prisma.book.findMany({
        where: { id: { in: ids }, archivedAt: null },
        orderBy: { title: 'asc' },
      });
      const orderMap = new Map(ids.map((id, i) => [id, i]));
      books.sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99));
      return res.json({ books, hasHistory: true });
    }

    const catalogList = catalog
      .filter((b) => !borrowedBookIds.includes(b.id))
      .map((b) => `- id: ${b.id}, title: "${b.title}", author: ${b.author}, tags: [${b.tags.join(', ')}]`)
      .join('\n');
    const historyList = borrowedBooks
      .map((b) => `"${b.title}" by ${b.author} (tags: ${b.tags.join(', ')})`)
      .join('; ');

    const prompt = `You are a librarian. A user has borrowed these books: ${historyList}.

Our catalog has these books (excluding what they already borrowed):
${catalogList}

Recommend exactly ${Math.min(RECOMMENDATIONS_MAX, catalog.length - borrowedBookIds.length)} book IDs from the catalog list that match the user's taste. Return ONLY a JSON array of those IDs in order of relevance, e.g. ["uuid1","uuid2"]. No other text.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      throw new Error(`Gemini API ${geminiRes.status}: ${err}`);
    }

    const data = (await geminiRes.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    let ids: string[] = [];
    if (text) {
      try {
        const raw = text.replace(/```json?\s*|\s*```/g, '').trim();
        const parsed = JSON.parse(raw) as string[];
        ids = Array.isArray(parsed)
          ? parsed.filter((id): id is string => typeof id === 'string').slice(0, RECOMMENDATIONS_MAX)
          : [];
      } catch {
        ids = [];
      }
    }

    const validIds = ids.filter((id) => catalog.some((b) => b.id === id) && !borrowedBookIds.includes(id));
    const books = await prisma.book.findMany({
      where: { id: { in: validIds }, archivedAt: null },
    });
    const orderMap = new Map(validIds.map((id, i) => [id, i]));
    books.sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99));

    res.json({ books, hasHistory: true });
  } catch (e) {
    next(e);
  }
});
