# Database Guide

```mermaid
erDiagram
  profiles ||--o| candidates : owns
  profiles ||--o| employers : owns
  employers ||--o{ jobs : posts
  candidates ||--o{ applications : submits
  jobs ||--o{ applications : receives
  employers ||--o{ employer_subscriptions : subscribes
  subscription_plans ||--o{ employer_subscriptions : defines
  employers ||--o{ talent_pools : owns
  talent_pools ||--o{ talent_pool_members : contains
  candidates ||--o{ talent_pool_members : joins
  applications ||--o{ candidate_stages : progresses
  applications ||--o{ interviews : schedules
  applications ||--o{ offers : receives
  platform_background_jobs }o--o| profiles : requested_by
```

## Hardening migration

Apply `supabase-platform-hardening.sql` after the existing subscription, ATS, and Talent CRM migrations. It adds queue, AI telemetry, and audit tables plus lookup indexes. All three new tables have RLS enabled and intentionally have no browser policies; access is service-role only.

## Operational checks

Run `EXPLAIN (ANALYZE, BUFFERS)` for queries above 250 ms. Review `pg_stat_statements` weekly where enabled. Keep foreign keys indexed, archive completed queue rows, and retain audit records according to company policy. Never run destructive migrations without a point-in-time backup and tested rollback.
