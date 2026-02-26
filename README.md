# Aspire Assessment – Mini Library Management System

Monorepo: **backend** (Express + Prisma + Neon) and **frontend** (Next.js).

## Quick start

1. **Install:** `npm install` (from repo root)
2. **DB:** Ensure `apps/backend/.env` has `DATABASE_URL` (Neon). Then:
   - `npm run build:db`
   - `npm run db:migrate`
   - `npm run db:seed`
3. **Backend:** `npm run dev:backend` (or from `apps/backend`: `npm run dev`)
4. **Frontend:** Set `NEXT_PUBLIC_API_URL=http://localhost:3001` in `apps/frontend/.env.local` (optional; that’s the default). Then `npm run dev:frontend` (or from `apps/frontend`: `npm run dev`).
5. **Login:** Open http://localhost:3000/login and paste a JWT from `npm run test:token` in `apps/backend`.

See `apps/backend/README.md` for API and env, and `apps/frontend/README.md` for frontend pages and dev login.

## Live deployment

- **Frontend (Vercel):** https://aspire-assesment-version-1-backend.vercel.app/
- **Backend (Railway):** https://aspire-backend-production.up.railway.app/

**For the live frontend to use the live backend:** In Vercel, set env var `NEXT_PUBLIC_API_URL=https://aspire-backend-production.up.railway.app` (no trailing slash), then redeploy.

**For the backend to accept requests from the frontend:** In Railway, set `CORS_ORIGIN=https://aspire-assesment-version-1-backend.vercel.app` (or leave `CORS_ORIGIN` unset to allow all origins with `*`).

**Frontend 404s (webpack.js, layout.js, etc.) or books not loading?**  
- Run the frontend in **dev** mode from inside the app: `cd apps/frontend` then `npm run dev`. Don’t use `npm start` for development.  
- Start the **backend** in another terminal: `cd apps/backend` then `npm run dev`, so the API at http://localhost:3001 is up.