# ADR-0020: Production Cutover And Fictional Smoke Gate

## Status

Accepted — Sprint 6 planning; cutover executes only after exit criteria evidence.

## Context

Vercel Production still points at staging Supabase. Real Production (`bwftfsfbiyzgwztwtqmh`) is schema-migrated and empty of customer content.

## Decision

1. Cutover to Production only with `npm run migrate` (never push) and additive fictional smoke data (never `seed:reset` on Production).
2. Require backup/restore rehearsal evidence against a non-Production target before loading content onto Production.
3. Customer content remains blocked until Product Director promotion approval after independent review finds no open Critical/High issues.
4. Rollback prefers Vercel redeploy of the last known-good build; do not destructively roll back migrations without a reviewed forward-recovery plan.

## Consequences

- Sprint 6 may ship code and staging evidence before Production cutover is complete; the handoff must record Not-verified ops items honestly.
