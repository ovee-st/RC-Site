# MXVL RC1 production readiness

## Release gate

RC1 is buildable, testable, and starts successfully when the required Supabase
configuration is present. Production startup intentionally fails fast when a
required variable is missing.

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Recommended production variables:

- `NEXT_PUBLIC_SITE_URL=https://www.mxvlab.com`
- `OPENAI_API_KEY` for provider-backed AI; deterministic fallbacks remain available
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `GA4_MEASUREMENT_ID`, and `GA4_API_SECRET` for analytics

Use `.env.example` as the deployment contract. Never expose the service-role key
through a `NEXT_PUBLIC_` variable.

## Fresh Supabase deployment

1. Create a disposable Supabase project and copy its URL, anon key, and
   service-role key into the deployment environment.
2. Apply every SQL file in the exact order in `supabase-migration-order.json`.
3. Rerun the chain once to verify idempotency.
4. Confirm `npm test -- tests/migrationChain.test.ts` passes.
5. Confirm the following storage buckets exist:
   `candidate-resumes`, `profile-photos`, `cvs`, `certifications`,
   `support-attachments`, `subscription-payment-proofs`, and
   `candidate-documents`.
6. Confirm `profile-photos` accepts WebP files up to 8 MB and
   `candidate-documents` remains private with its 10 MB MIME allowlist.
7. Verify representative candidate, employer, admin, support, and ATS accounts
   against RLS before inviting beta users.
8. Call `/api/health`; do not release unless environment, database, storage, and
   authentication checks are healthy. AI may be degraded when deterministic
   fallbacks are intentionally used.

The repository can statically validate migration dependencies and object
references. Applying the chain to a new hosted project remains a manual release
step because no disposable Supabase project or deployment credentials are
available in this workspace.

## Security review

Fixed in RC1:

- Secured the notification trigger with bearer authentication, ownership/admin
  authorization, validation, request-size limits, and per-instance rate limits.
- Added the missing `notifications` table, indexes, RLS, and owner-scoped policies.
- Removed temporary logs containing user, role, token-length, payment, coupon,
  and analytics diagnostics.
- Upgraded Next.js and pinned patched PostCSS/Sharp versions. `npm audit` reports
  zero known production or development vulnerabilities.
- Added storage-enforced MIME and size limits for profile photos.
- Preserved correlation IDs, redacted structured logging, HSTS, clickjacking,
  MIME-sniffing, referrer, permissions, and opener protections.

Remaining security work:

- Public contact, hiring-consultation, career-event, and analytics endpoints need
  distributed edge rate limiting; in-memory limits are not reliable across
  serverless instances.
- `support-attachments`, `candidate-resumes`, and legacy CV/certification buckets
  use public URLs. Migrating them to private buckets requires signed-URL changes
  and should be completed before storing sensitive private-beta documents.
- Upload checks rely partly on declared MIME types. Add server-side file-signature
  scanning and malware scanning for documents before a broad public launch.
- A strict Content Security Policy is not yet deployed. Introduce it first in
  report-only mode because Supabase, GA4, images, and OAuth need explicit origins.
- Service-role clients bypass RLS by design; all such routes must retain explicit
  ownership checks. RC1 found one unsafe mutation and corrected it.
- Bearer-token APIs are not cookie-authenticated, so classic CSRF is not the
  primary risk; XSS token theft remains important until CSP is in place.

## Performance and browser QA

Lighthouse production baseline on the homepage:

| Metric | Before | After authenticated-branch code splitting |
| --- | ---: | ---: |
| Transfer | 510 KB | 443 KB |
| FCP | 1.37 s | 0.96 s |
| LCP | 4.07 s | 4.30 s |
| TBT | 1,043 ms | 1,354 ms |
| Performance score | 63 | 60 |
| Accessibility | 93 | 93 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |

The split reduced initial transfer by 13% and improved FCP, but a single
throttled run did not improve LCP/TBT. Treat the score difference as noisy and
profile the hero on production before further optimization. Lighthouse also
reports contrast, prohibited ARIA attributes, and forced-reflow findings.

Smoke checks passed in Chrome, Edge, Playwright WebKit, Android Chrome emulation,
and iPhone WebKit emulation with no horizontal overflow on tested routes.
Firefox automation could not start on this Windows host because its software
WebRender compositor could not map the headless framebuffer. Physical Safari,
iPhone, Android, and authenticated live-Supabase workflow testing remain manual
release gates.

## Known release risks

- ESLint has no errors but retains warnings in legacy modules, primarily explicit
  `any`, effect-driven state updates, and raw `<img>` usage.
- The desktop homepage hero leaves excess empty space and wraps its final word
  awkwardly at 1440 px. This is a visual-polish issue, not a functional blocker.
- Real email delivery, OAuth provider settings, GA4 receipt, and AI provider calls
  require production credentials and external-console verification.
- Verify Supabase Auth redirect URLs for `https://www.mxvlab.com/auth/callback` and
  the Vercel preview domain before beta invitations.
