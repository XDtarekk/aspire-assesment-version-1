import { Router } from 'express';
import { Role } from '@aspire/db';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { enrichBookSchema } from '../validation/ai.js';

export const aiRouter = Router();

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.AI_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';

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
