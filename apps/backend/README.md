# Aspire Backend (Express + Prisma + Neon)

API for the Mini Library Management System.

## Stack

- **Express** (TypeScript)
- **Prisma** – ORM and schema in `packages/db`
- **Neon** – Postgres (use `DATABASE_URL` in `.env`)
- **Zod** – request validation
- **JWT** – auth (Next.js issues tokens; backend verifies)

## Env (see `.env.example`)

- `DATABASE_URL` – Neon Postgres URL (required)
- `JWT_SECRET` – same secret used by Next.js to sign JWTs (required in prod)
- `CORS_ORIGIN` – optional; default `*`
- `ADMIN_EMAIL` – used by seed to create/update ADMIN user
- `LIBRARIAN_EMAIL` / `LIBRARIAN_PASSWORD` – optional; seed creates a LIBRARIAN with password (defaults below)

## Commands (from repo root or `apps/backend`)

```bash
# Install (from repo root)
npm install

# Generate Prisma client + build db package
npm run build:db

# Migrate (loads .env from apps/backend)
npm run db:migrate          # deploy migrations
npm run db:migrate:dev      # dev migration (from apps/backend)
npm run db:seed             # seed admin + sample books

# Run API
npm run dev     # tsx watch (from apps/backend)
npm start       # node dist/index.js (after npm run build)
```

## API

- `GET /health` – health check
- **Books** (search: `?q=`, `?title=`, `?author=`, `?tag=`, `?status=`)
  - `GET /api/books` – list (public)
  - `GET /api/books/:id` – one (public)
  - `POST /api/books` – create (ADMIN/LIBRARIAN, body: title, author, isbn?, description?, imageUrl?, tags?)
  - `PATCH /api/books/:id` – update (ADMIN/LIBRARIAN)
  - `DELETE /api/books/:id` – soft delete (ADMIN/LIBRARIAN)
- **Image upload** (ADMIN/LIBRARIAN)
  - `POST /api/upload` – upload a cover image (multipart form field `image`); returns `{ imageUrl: "/uploads/..." }`. Use this URL in book create/update. Max 5MB; JPEG, PNG, GIF, WebP only. Served at `GET /uploads/:filename`.
- **AI – Book enrichment** (ADMIN/LIBRARIAN)
  - `POST /api/ai/enrich-book` – body `{ title, author }`; returns `{ description, tags }` using Gemini. If `GEMINI_API_KEY` is unset, returns a stub. Use in Add/Edit Book UI as “Generate Summary + Tags”.
- **Loans**
  - `POST /api/loans/checkout` – checkout (auth, body: `{ bookId }`)
  - `POST /api/loans/return` – return (auth, body: `{ loanId }`)
  - `GET /api/loans/me` – my loans (auth)
  - `GET /api/loans` – all loans (ADMIN/LIBRARIAN)
- **Users** (ADMIN only)
  - `GET /api/users` – list users
  - `PATCH /api/users/:id/role` – set role (body: `{ role }`)

Auth: `Authorization: Bearer <jwt>`. JWT payload should include `sub` (user id) and `role` (ADMIN | LIBRARIAN | MEMBER).

## Testing the API

**1. Public endpoints (no auth)** – ensure the backend is running (`npm start` or `npm run dev`).

```bash
# Health
curl http://localhost:3001/health

# List books (optional query params: q, title, author, tag, status)
curl "http://localhost:3001/api/books"
curl "http://localhost:3001/api/books?q=gatsby"
curl "http://localhost:3001/api/books?tag=fiction"

# One book (use an id from the list)
curl http://localhost:3001/api/books/<book-id>
```

**PowerShell:**

```powershell
Invoke-RestMethod http://localhost:3001/health
Invoke-RestMethod "http://localhost:3001/api/books"
```

**2. Get a test JWT (for protected routes)**

From `apps/backend`:

```bash
npm run test:token
```

Copy the printed `Authorization: Bearer <token>` and use it in the next requests.

**3. Authenticated endpoints**

Replace `YOUR_TOKEN` with the token from step 2.

```bash
# My loans
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/loans/me

# All loans (ADMIN/LIBRARIAN)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/loans

# List users (ADMIN only)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/users

# Checkout a book (use a real book id)
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \
  -d "{\"bookId\":\"<book-uuid>\"}" http://localhost:3001/api/loans/checkout

# Create a book (ADMIN/LIBRARIAN)
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \
  -d "{\"title\":\"Test Book\",\"author\":\"Author\"}" http://localhost:3001/api/books
```

**PowerShell (with token in variable):**

```powershell
$token = "YOUR_TOKEN"
Invoke-RestMethod -Uri "http://localhost:3001/api/loans/me" -Headers @{ Authorization = "Bearer $token" }
```

**4. Postman / Insomnia / Thunder Client**

- Base URL: `http://localhost:3001`
- For protected routes: add header `Authorization: Bearer <token>` (get token via `npm run test:token`).

## Seeded accounts (after `npm run db:seed`)

| Role     | Email                 | Password     | Use |
|----------|-----------------------|--------------|-----|
| ADMIN    | `admin@example.com`   | (no password; use dev token) | Get JWT via `npm run test:token` or set password in Admin → Users. |
| LIBRARIAN| **`librarian@example.com`** | **`librarian123`** | Log in on the app with “Librarian sign in” (email + password). |

Override librarian email/password with env when seeding: `LIBRARIAN_EMAIL`, `LIBRARIAN_PASSWORD`.
