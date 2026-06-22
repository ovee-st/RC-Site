# MXVL Performance Audit

Audit date: 2026-06-22

## Baseline findings

- All admin routes imported the 131 KB `AdminPanel.tsx` client component and Recharts, including routes that never render charts.
- The largest identified client chunk was the Recharts bundle at 449,432 bytes.
- Admin Dashboard and Employers loaded `/api/admin/records` first, then loaded employer subscriptions in a second serial request.
- Auth initialization performed a remote user validation plus profile, candidate, and employer reads. Initial auth events could request the same profile concurrently.
- Global route transitions used `AnimatePresence` in wait mode with a 280 ms exit transition before the next route rendered.
- Admin route changes remounted the panel and reloaded unchanged records without a route-level cache.
- Admin reads and current subscription queries lacked several composite indexes matching their filters and ordering.

## Implemented optimizations

- Recharts is dynamically imported through `AdminDashboardCharts` and is requested only by the admin dashboard.
- Dashboard charts have an independent fixed-size loading skeleton and no longer block the rest of the dashboard.
- Employer subscriptions are loaded in the main parallel admin records request, removing one serial API/auth round trip.
- Admin section records use a 30-second client cache with in-flight request deduplication. Writes invalidate the cache.
- Auth starts from the locally available session, deduplicates profile requests, caches profiles for 60 seconds, and removes unconditional candidate/employer profile reads.
- The global 280 ms wait transition was removed while preserving the layout and route behavior.
- The admin records endpoint emits a `Server-Timing: admin-db` measurement for production diagnostics.
- `supabase-performance-indexes.sql` adds idempotent composite indexes for admin lists, subscriptions, usage, jobs, applications, notifications, and transactions.

## Build measurements

| Measurement | Before | After |
| --- | ---: | ---: |
| Chart chunk affecting every admin route | 449,432 B initial | 0 B on non-dashboard routes |
| Deferred dashboard chart chunk | Not split | 361,671 B |
| Main admin feature chunk | Coupled to chart bundle | 87,962 B |
| Fixed navigation exit delay | 280 ms | 0 ms |
| Auth-related table reads on normal hydration | 3 | 1 |
| Dashboard/Employer admin data API phases | 2 serial phases | 1 phase |

## Query assessment

The highest-risk database paths were current employer subscription selection, current usage selection, employer job lists, application lists, notification lists, and admin records ordered by creation/update time. The added indexes match those filter and order patterns. Exact production query latency requires Supabase query statistics; the new `Server-Timing` header provides endpoint-level database timing after deployment.

## Deployment note

Run `supabase-performance-indexes.sql` once in the Supabase SQL editor. Every statement uses `if not exists`, so the script is safe to run against an existing MXVL schema.
