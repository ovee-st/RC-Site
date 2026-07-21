# Supabase migration audit

## Scope

Audited all 17 root-level Supabase SQL migrations in the order recorded in
`supabase-migration-order.json`.

Static inventory after the corrections:

| Object | Count |
| --- | ---: |
| Public tables | 66 |
| Foreign-key references | 145 |
| Indexes | 84 |
| RLS-enabled public tables | 66 |
| Policies | 138 |
| Functions | 20 declarations / 19 names |
| Triggers | 8 |

`generate_rc_username` is intentionally overloaded: the base helper takes four
arguments, while the support helper takes one. It is not a duplicate signature.

## Corrected findings

### Broken indexes

- Removed the stale conditional `notifications_user_created_at_idx`. No
  migration creates `public.notifications`; workflow notifications live in
  `public.recruitment_notifications`, which already has
  `recruitment_notifications_user_unread_idx`.
- The previously corrected hardening index now uses `public.jobs.employer_id`.
  `public.jobs.employer_user_id` does not exist.

### Missing columns

The base migration creates the support tables before
`supabase-support-system.sql`. The later `CREATE TABLE IF NOT EXISTS` statements
were therefore skipped, leaving these expected columns absent:

- `employees.avatar_url`
- `employees.role`
- `employees.status`
- `employees.is_active`
- `support_tickets.category`
- `support_tickets.attachment_url`
- `ticket_messages.attachment_url`
- `ticket_messages.is_internal_note`

The support migration now adds every extension column explicitly.

### Invalid foreign keys

No foreign key points to a missing public table or missing referenced column in
the corrected chain. The repeated support table declarations previously
described competing `assigned_employee_id` foreign-key shapes; those duplicate
declarations were removed and the base schema remains canonical.

### Duplicate objects

Removed repeated declarations of `employees`, `support_tickets`, and
`ticket_messages`. Also removed duplicate or redundant index declarations for:

- profile usernames
- support ticket user, status, and assignee lookups
- ticket message ticket lookups
- candidate user lookups

The support ticket timestamp function and trigger now have a single owner.

### Seed and rerun safety

- Fixed the employee backfill to populate required `employees.user_id`.
- Changed support macro seeding to insert only missing titles. The previous
  `ON CONFLICT DO NOTHING` had no supporting unique constraint and inserted
  duplicate macro rows on every rerun.

### Migration ordering

The repository previously had no executable order contract. The new
`supabase-migration-order.json` records dependencies explicitly, including:

- base schema before all extensions
- subscriptions before manual payments
- support before live chat and support operations
- enterprise workflow before Talent CRM
- feature tables before performance and hardening indexes

## Validation

`tests/migrationChain.test.ts` verifies:

- every root migration appears exactly once in the manifest
- dependency-sensitive ordering
- index table and column targets
- public foreign-key targets
- policy and trigger table targets
- trigger function declarations
- canonical ATS ownership columns
- canonical support extension columns

## Remaining recommendations

- Apply the ordered chain to a disposable Supabase project before production.
  Static validation cannot reproduce extension versions, existing production
  data conflicts, or project-specific storage/publication configuration.
- Review `pg_stat_user_indexes` after representative production traffic before
  removing any additional indexes. Static overlap is resolved, but runtime
  index usage cannot be established from repository files.
- Move future migrations into timestamped Supabase CLI migration files while
  retaining this manifest for the existing baseline.
