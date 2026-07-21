# E2E Tests

Public and health tests run without accounts. Set `E2E_EMPLOYER_EMAIL` and `E2E_EMPLOYER_PASSWORD` to a dedicated non-production employer to enable authenticated workspace checks. Never use production credentials.

Run `npx playwright install chromium`, then `npm run test:e2e -- --project=chromium`. Full mutation tests should use an isolated Supabase project, deterministic seed records, and teardown by test run ID.
