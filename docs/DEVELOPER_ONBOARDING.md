# Developer Onboarding

1. Install Node 20 and clone the repository.
2. Run `npm ci`.
3. Create `.env.local` using `docs/ENVIRONMENT.md`; use a non-production Supabase project.
4. Apply existing SQL migrations, then `supabase-platform-hardening.sql`.
5. Run `npm run dev` and open `http://127.0.0.1:3000`.

Before a pull request run:

```text
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e:list
```

Use route-level permission helpers, explicit Supabase columns, typed DTOs, centralized errors, and redacted logging. Do not log request headers or user PII. Add tests at the same ownership boundary as the change. Keep migrations additive and reversible.
