# ADR-0008: Production Readiness Gates Before Investor Features

## Status

Accepted for Sprint 3 planning.

## Context

Sprint 2's application-level review fixes passed extensive checks, but the review still found a public storage bucket, active exposed secrets, an insecure TLS escape hatch, an untested incremental migration path and no real cloud media fixture. These failures can expose unpublished technical mining content even when application routes are correct.

## Decision

Sprint 3 is a production-hardening milestone. Private storage, credential rotation, verified TLS, controlled migrations, real cloud media verification, production guardrails, public API minimization, committed remediation and recovery evidence are prerequisites for Production promotion. Investor features move to Sprint 4.

## Consequences

- The next implementation sprint is narrower and prioritizes release safety over feature breadth.
- A green local test suite is insufficient without cloud and infrastructure evidence.
- Vercel Pro Preview and Supabase Pro staging remain the required verification environment.
- Market data, analytics, subscriptions and investor accounts wait until the release gates pass.
- Any exception requires an explicit Product Director decision and a documented risk acceptance; Critical storage and credential findings should not be waived.

## Evidence Standard

Claims are marked verified only when supported by a reproducible command, deployment observation, infrastructure setting, test fixture or review artifact. Zero-file media tests do not verify cloud media authorization.
