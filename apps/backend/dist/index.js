"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const books_js_1 = require("./routes/books.js");
const loans_js_1 = require("./routes/loans.js");
const users_js_1 = require("./routes/users.js");
const upload_js_1 = require("./routes/upload.js");
const ai_js_1 = require("./routes/ai.js");
const auth_js_1 = require("./routes/auth.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use((0, cors_1.default)({ origin: corsOrigin }));
app.use(express_1.default.json());
const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
app.use('/uploads', express_1.default.static(uploadsDir));
app.get('/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
});
app.use('/api/books', books_js_1.booksRouter);
app.use('/api/loans', loans_js_1.loansRouter);
app.use('/api/users', users_js_1.usersRouter);
app.use('/api/upload', upload_js_1.uploadRouter);
app.use('/api/ai', ai_js_1.aiRouter);
app.use('/api/auth', auth_js_1.authRouter);
app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});
app.use(errorHandler_js_1.errorHandler);
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
