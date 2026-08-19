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

## CSP and browser failure behavior (Sprint 5 / S4-4)

1. Deployed responses must include Content-Security-Policy `frame-src https://www.openstreetmap.org` (see `src/lib/content-security-policy.ts`). Wildcards and `unsafe-*` in `frame-src` are forbidden.
2. Without that directive, browsers block the OSM iframe under `default-src 'self'`.
3. The map component mounts the iframe client-side, clears a load watchdog on successful cross-origin `load`, and on timeout/error/Hide shows **"Map unavailable. Use the location details above."** while keeping jurisdiction, location summary and coordinates. Visitors must never see a silent blank rectangle.
4. Browser verification (not HTML-grep alone) is required when claiming the map works.

## Visitor privacy implication

Loading the OSM embed causes the visitor’s browser to request `openstreetmap.org` (and typically OSM tile hosts). That discloses the visitor’s IP address and standard request metadata to the OpenStreetMap Foundation / tile operators. Sprint 4’s “no investor PII storage” goal does **not** mean “no third-party network disclosure.” This disclosure is **accepted** for the illustrative embed; a future click-to-load or self-hosted tile option may reduce it if Product Director requires stricter privacy.