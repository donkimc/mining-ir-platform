# ADR-0013: AI Data Egress and Provider Policy

## Status

Accepted for Sprint 5 (2026-08-18) — **no external AI egress**.

## Context

Sending unpublished NI 43-101 reports or drill results to a third-party LLM crosses the tenant confidentiality boundary. Provider SDKs, API keys, retention, training use, residency and subprocessors are not yet approved.

## Decision (Sprint 5)

1. **No external AI provider calls** in Sprint 5. Unpublished tenant documents must not leave the application boundary for model inference.
2. No AI provider SDKs, provider secrets or provider environment variables are added.
3. The codebase may define a **provider-neutral extraction adapter interface** and a **deterministic fictional fixture adapter** that performs no network I/O.
4. Logging, errors and telemetry must not include document bytes or raw source excerpts.
5. If the Product Director later approves egress, this ADR must be amended **before** implementation with: retention, training opt-out, data residency, subprocessors, tenant consent, deletion, encryption in transit/at rest, logging policy, cost controls and outage behavior. A separate security/privacy review is required.

## Consequences

- Sprint 5 proves ingestion, provenance and human review without live extraction risk.
- Tests assert the default adapter makes zero network calls and that missing/disabled providers never auto-publish.
- Enabling a real provider is an explicit product decision, not a Cursor default.
