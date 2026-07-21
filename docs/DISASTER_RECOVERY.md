# Disaster Recovery

## Targets

- Target RPO: 24 hours without PITR; 15 minutes with Supabase PITR.
- Target RTO: 4 hours for application restore; validate against the selected Supabase plan.

## Runbook

1. Declare incident, stop writes if integrity is uncertain, and record correlation IDs and deployment SHA.
2. Roll back Vercel for application-only regressions.
3. Restore Supabase into a separate project for data incidents; validate counts, foreign keys, Auth linkage, RLS, and Storage references before DNS/config cutover.
4. Rotate service, OAuth, OpenAI, analytics, and webhook secrets after credential exposure.
5. Replay idempotent queued jobs; move poison jobs to dead letter and review manually.
6. Verify `/api/health` and the critical Playwright journey before reopening traffic.
7. Document timeline, impact, data loss, and preventive actions.

Test restore procedures quarterly. Export database schema and Storage inventory with every major release.
