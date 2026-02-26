# Aspire Frontend (Next.js)

Web UI for the Mini Library Management System.

## Stack

- **Next.js 14** (App Router)
- **Tailwind CSS v3**
- **Client-side auth** – JWT stored in `localStorage` (paste token from backend for dev; Google SSO can be added later)

## Env

Create `.env.local` (see `.env.example`):

- `NEXT_PUBLIC_API_URL` – backend API base URL (default `http://localhost:3001`). For production (Vercel), set to `https://aspire-backend-production.up.railway.app`.

## Commands

**Always run these from `apps/frontend`** (not from repo root), so Next.js finds the app and serves assets correctly:

```bash
cd apps/frontend
npm install
npm run dev    # Development: http://localhost:3000 (use this for daily dev)
npm run build  # Then npm start for production
npm start      # Production only – run after build
```

- **Development:** use `npm run dev`. Do **not** use `npm start` for dev or you’ll get 404s for JS/CSS.
- **Books not loading?** Start the backend in another terminal: `cd apps/backend && npm run dev`, then refresh. The frontend calls `http://localhost:3001` by default.

## Pages

- **/** – Browse books (search, filters, status badges)
- **/books/[id]** – Book detail + checkout (when logged in and available)
- **/me/loans** – My loans + return (requires login)
- **/login** – Paste JWT token (get one with `npm run test:token` in backend)
- **/admin/books** – CRUD books, add/edit modal, “Generate summary + tags” (AI), image upload (ADMIN/LIBRARIAN)
- **/admin/loans** – All loans, mark returned (ADMIN/LIBRARIAN)
- **/admin/users** – List users, change role (ADMIN only)

## Dev login

1. Start the backend and run `npm run test:token` in `apps/backend`.
2. Copy the printed Bearer token.
3. Open `/login` and paste the token to log in.
