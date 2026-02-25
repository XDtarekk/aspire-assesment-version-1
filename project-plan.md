Got you. Here’s a **Cursor-ready implementation plan** you can paste directly. It’s written like a task spec Cursor can execute step-by-step.

--

## Project Plan (Cursor Spec)

Build **Mini Library Management System v1** using:

* **Frontend:** Next.js (TypeScript) hosted on **Vercel**
* **Backend:** Express.js (TypeScript) hosted on **Render** (or Railway)
* **Database:** Postgres on **Neon**
* **ORM:** Prisma
* **Auth:** Google SSO (OAuth) + JWT-secured API
* **Roles:** ADMIN, LIBRARIAN, MEMBER
* **AI features:** (1) book enrichment (summary/tags), (2) natural language search → structured filters

### Deliverables

* Source code (monorepo)
* README (setup + run + env vars)
* Deployed Web URL (Vercel)
* Deployed API URL (Render/Railway)
* Authentication with SSO + roles/permissions
* Demonstrate creativity via AI + small extra features

---

## 1) Repo Structure (Monorepo)

Create a monorepo with pnpm workspaces:

```
/apps
  /web        # Next.js
  /api        # Express
/packages
  /db         # Prisma schema + migrations + Prisma client wrapper
```

Use shared Prisma package so both apps can import Prisma client.

---

## 2) Database Schema (Prisma)

Create `packages/db/prisma/schema.prisma` with:

### Enums

* Role: `ADMIN | LIBRARIAN | MEMBER`
* BookStatus: `AVAILABLE | CHECKED_OUT | LOST | ARCHIVED`

### Models

**User**

* id (uuid)
* email (unique)
* name
* role (default MEMBER)
* createdAt

**Book**

* id (uuid)
* title
* author
* isbn (optional, unique if present)
* description (optional)
* tags (string[])
* status (BookStatus default AVAILABLE)
* createdAt, updatedAt
* archivedAt (optional) for soft delete

**Loan**

* id (uuid)
* bookId (FK)
* userId (FK)
* checkedOutAt (default now)
* dueAt
* returnedAt (nullable)

**AuditLog (bonus)**

* id
* actorId (FK User)
* action (string)
* entityType (string)
* entityId (string)
* metadata (json)
* createdAt

Add indexes:

* Book: index on (title), (author), (status)
* Loan: index on (userId), (bookId), (returnedAt)

---

## 3) Backend (Express API)

### Setup

* TypeScript Express app
* CORS allow web origin (Vercel + localhost)
* Zod validation for all request bodies
* Prisma client via `packages/db`

### Auth Strategy (simple + solid)

* Next.js handles Google login
* Next.js generates JWT for API OR uses NextAuth JWT
* Express verifies JWT on requests:

  * Extract Bearer token
  * Verify signature
  * Read `userId` + `role`

Implement middleware:

* `requireAuth`
* `requireRole(roles[])`

### API Routes

#### Health

* `GET /health` → { ok: true }

#### Books

* `GET /books`

  * query params: `q`, `title`, `author`, `tag`, `status`
  * implement search with contains/ILIKE behavior (Prisma `contains` + mode insensitive)
* `GET /books/:id`
* `POST /books` (ADMIN/LIBRARIAN)
* `PATCH /books/:id` (ADMIN/LIBRARIAN)
* `DELETE /books/:id` (ADMIN/LIBRARIAN)

  * soft delete: set `archivedAt` and status ARCHIVED

#### Loans

* `POST /loans/checkout` (auth required)

  * body: { bookId }
  * rules:

    * book must be AVAILABLE
    * create Loan with dueAt = now + 14 days
    * set book status CHECKED_OUT
    * do this in a Prisma transaction
* `POST /loans/return` (auth required)

  * body: { loanId }
  * rules:

    * member can return only their own loan
    * librarian/admin can return any loan
    * set returnedAt
    * set book status AVAILABLE
    * transaction
* `GET /loans/me` (MEMBER)
* `GET /loans` (ADMIN/LIBRARIAN)

#### Users (Admin)

* `GET /users` (ADMIN)
* `PATCH /users/:id/role` (ADMIN) body: { role }

---

## 4) Frontend (Next.js)

### Pages

* `/` search page (books list, filters, status badges)
* `/books/[id]` book detail + checkout button (if available)
* `/me/loans` my loans + due date highlight
* `/admin/books` CRUD table + add/edit modal
* `/admin/loans` manage loans
* `/admin/users` manage roles (ADMIN only)
* `/login` sign-in with Google

### UI

* Use shadcn/ui (or minimal Tailwind components)
* Keep it clean: tables, badges, dialogs, toast notifications

### API Integration

* Use `NEXT_PUBLIC_API_URL`
* Axios or fetch wrapper with auth token injection
* Handle errors gracefully (toasts)

---

## 5) AI Features (Must-have)

### AI Feature #1: Book Enrichment

UI button in Add/Edit Book:

* “Generate Summary + Tags”
* calls API: `POST /ai/enrich-book` with { title, author }
* response: { description, tags }
* allow librarian to accept/edit before saving

### AI Feature #2: Natural Language Search

Search bar supports:

* “books about finance by author like taleb”
* calls API: `POST /ai/parse-search` { text }
* response: { q, author, tags, status }
* apply filters automatically and fetch `/books`

Implementation notes:

* Keep output strictly structured JSON
* Cache by (title+author) or (search text) to reduce cost

If no real AI provider allowed, provide a fallback stub mode via env var.

---

## 6) Seed & Bootstrap

* Prisma seed script:

  * Create initial ADMIN user based on email in env var `ADMIN_EMAIL`
  * Add 10–20 sample books
* First-login fallback rule (optional):

  * if user not exists, create as MEMBER

---

## 7) Deployment

### Neon

* Create DB
* get `DATABASE_URL`

### API (Render)

* Build + start scripts
* Set env vars:

  * DATABASE_URL
  * JWT_SECRET (or JWT_PUBLIC_KEY)
  * CORS_ORIGIN (vercel domain)
  * AI_KEY (optional)
* Deploy, confirm `/health`

### Web (Vercel)

* Set env vars:

  * NEXT_PUBLIC_API_URL
  * GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
  * AUTH_SECRET
  * ADMIN_EMAIL
* Deploy

---

## 8) README (required)

Include:

* What the app is
* Tech stack
* Features (CRUD, checkout/return, search, AI, roles)
* Local setup:

  * pnpm install
  * set env vars
  * prisma migrate
  * prisma seed
  * run dev
* Deployment URLs
* Role testing instructions

---

## 9) Extra Features (pick 2)

* Audit log for book changes + checkouts/returns
* Soft delete restore in admin
* CSV import/export of books
* Overdue highlighting + quick filter

---

If you want it even more “Cursor-friendly”, tell me whether you’ll use **NextAuth/Auth.js** for Google login or you want a **custom Google OAuth flow**, and I’ll adjust the auth steps + exact env vars accordingly.
