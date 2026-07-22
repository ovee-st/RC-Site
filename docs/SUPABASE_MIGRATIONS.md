# Supabase migration chain

Apply the root-level Supabase SQL files in the exact order defined by
`supabase-migration-order.json`. The order is part of the schema contract:

- `supabase-schema.sql` owns the original public tables and shared helpers.
- Authentication, profile media, subscriptions, and support migrations extend
  those base tables.
- Live chat depends on the support tables.
- Talent CRM depends on the enterprise recruitment workflow helpers.
- Talent CRM stabilization runs immediately after the base CRM migration and
  hardens its policies, timestamps, indexes, and schema diagnostics.
- Performance indexes run after all feature tables exist.
- Platform hardening runs last because it indexes ATS tables.

Every migration is intended to be rerunnable. Run `npm test --
tests/migrationChain.test.ts` before deployment to verify the manifest, table
dependencies, foreign-key targets, index columns, policy targets, and trigger
functions.

For optional local demo pools, explicitly set the database setting
`app.environment` to `development`, `local`, or `test`, then run
`scripts/seed-talent-crm-development.sql`. The seed refuses to execute in any
other environment and never creates users or production records.
