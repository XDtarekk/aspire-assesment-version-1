"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRouter = void 0;
const express_1 = require("express");
const db_1 = require("@aspire/db");
const auth_js_1 = require("../middleware/auth.js");
const ai_js_1 = require("../validation/ai.js");
exports.aiRouter = (0, express_1.Router)();
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.AI_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
function stubEnrich(title, author) {
    return {
        description: `A book titled "${title}" by ${author}. Add a description or use AI when GEMINI_API_KEY is set.`,
        tags: ['fiction', 'general'],
    };
}
async function enrichWithGemini(title, author) {
    if (!GEMINI_KEY)
        return stubEnrich(title, author);
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
    const data = (await res.json());
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text)
        return stubEnrich(title, author);
    try {
        const raw = text.replace(/```json?\s*|\s*```/g, '').trim();
        const parsed = JSON.parse(raw);
        const description = typeof parsed.description === 'string' ? parsed.description : stubEnrich(title, author).description;
        const tags = Array.isArray(parsed.tags) ? parsed.tags.filter((t) => typeof t === 'string').slice(0, 10) : ['fiction', 'general'];
        return { description, tags };
    }
    catch {
        return stubEnrich(title, author);
    }
}
exports.aiRouter.post('/enrich-book', auth_js_1.requireAuth, (0, auth_js_1.requireRole)(db_1.Role.ADMIN, db_1.Role.LIBRARIAN), async (req, res, next) => {
    try {
        const parsed = ai_js_1.enrichBookSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.flatten() });
        const { title, author } = parsed.data;
        const result = await enrichWithGemini(title, author);
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
