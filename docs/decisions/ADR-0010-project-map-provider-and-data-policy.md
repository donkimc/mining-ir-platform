# ADR-0010: Project Map Provider and Data Policy

## Status

Accepted for Sprint 4 (2026-08-16) — **provider-neutral, no paid API key**.

## Context

Projects already store `latitude`, `longitude` and `locationSummary`. No map provider or API-key policy is approved in the repository. Silently selecting Mapbox/Google would introduce licensing, quotas and client-key exposure without a Product Director decision.

## Decision

1. Implement a **provider-neutral** `ProjectLocationMap` component.
2. When coordinates are valid, render an **OpenStreetMap embed iframe** (`openstreetmap.org/export/embed.html`) — no API key, no SDK dependency.
3. Always render an accessible **text location fallback** (jurisdiction, location summary, optional coordinate text) that remains usable if the iframe fails or coordinates are missing.
4. Label the visual as an **illustrative location**, not a technical survey product.
5. Never render markers for Draft, Review, Archived, wrong-tenant or invalid coordinates.
6. Do not expose unrestricted third-party map API keys in client output.

If a paid provider is later approved, replace only the visual adapter behind the same component contract and revise this ADR.

## Consequences

- No new env vars or paid billing assumptions for Sprint 4.
- OSM attribution remains visible via the embed.
- Product Director may later approve Mapbox/Google via an amended ADR-0010.
