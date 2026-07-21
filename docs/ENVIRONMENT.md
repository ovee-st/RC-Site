# Environment Guide

## Required

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser/server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/server | Public anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Privileged API/database operations |
| `NEXT_PUBLIC_SITE_URL` | Build/server | Canonical production origin |

## Optional

- `OPENAI_API_KEY`, `OPENAI_RECRUITING_MODEL`: AI provider; deterministic fallbacks remain available.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `GA4_MEASUREMENT_ID`, `GA4_API_SECRET`: browser and first-party analytics.
- `FEATURE_TALENT_CRM`, `FEATURE_CAREER_PAGES`, `FEATURE_AI_RECRUITER`, `FEATURE_WORKFLOW_AUTOMATION`, `FEATURE_CANDIDATE_PORTAL`, `FEATURE_SEMANTIC_REDISCOVERY`: `true`/`false` overrides.
- `E2E_EMPLOYER_EMAIL`, `E2E_EMPLOYER_PASSWORD`: dedicated non-production E2E account.

Secrets belong in Vercel encrypted environment variables and GitHub Actions secrets. Never prefix server secrets with `NEXT_PUBLIC_`. `instrumentation.ts` fails production startup when required server configuration is absent and emits non-secret warnings for optional integrations.
