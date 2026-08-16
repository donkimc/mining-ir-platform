# ADR-0009: Sprint 4 Investor-Feature Boundary

## Status

Accepted for Sprint 4 implementation (2026-08-16).

## Context

`docs/ROADMAP.md` labels Sprint 4 “Investor Features,” while `AGENTS.md` keeps live stock quotes, analytics and investor accounts out of the MVP. Sprint 3 release gates are closed; the remaining product need is safer public discovery and a narrow project-location experience.

## Decision

Sprint 4 ships:

- Carry-in fixes M-1, L-1, L-2, L-3 (and optional N3/N4 when safe).
- Anonymous published-only Explorer search/filtering and related-content navigation.
- Read-only project location maps with accessible text fallback.

Sprint 4 does **not** ship:

- Live market/stock data, investor analytics or recommendations.
- Email subscriptions, notifications or investor PII storage.
- Investor accounts, CRM or saved portfolios.
- AI ingestion, SEDAR+, billing, custom domains or new templates.
- Advanced GIS, drill-hole layers or 3D maps.

## Consequences

- Implementation stays anonymous and published-only.
- Market data, analytics and subscriptions require future ADRs before coding.
- Independent review treats tenant leakage and unpublished content exposure as release-blocking.
