# Deployment Guide

1. Provision a dedicated Supabase production project and enable backups/PITR.
2. Apply SQL migrations in dependency order, ending with `supabase-platform-hardening.sql`.
3. Configure Vercel environment variables from `docs/ENVIRONMENT.md` for Production and Preview separately.
4. Configure Google OAuth callback URLs and Supabase Storage policies for the production hostname.
5. Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
6. Deploy to Preview, run Playwright smoke tests, inspect `/api/health`, then promote.
7. Verify Auth, job publish/apply, pipeline movement, interview/offer, storage upload, email, analytics, and realtime support.

Rollback by promoting the previous Vercel deployment. Database rollbacks must use a reviewed compensating migration; never edit production tables manually. Treat a degraded AI check as non-blocking when deterministic fallback is expected, but treat database/auth/storage failures as release blockers.
