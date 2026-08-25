# ADR-0017: Summit Presentation Template Contract

## Status

Accepted — Product Director 2026-08-20; reconciles ADR-0002.

## Context

ADR-0002 chose Explorer first. It did not require Explorer to remain the only template forever. Sprint 6 needs a second presentation for Veylithra without forking authorization or disclosure controls.

## Decision

1. Add exactly one second presentation template key: `summit`.
2. Explorer remains the primary demo template for Qelvarion and the baseline regression surface.
3. `summit` is a **presentation layer only**. It must reuse server-side tenant resolution, published-only public helpers and serializers, Draft → Review → Published status-only approval, private media authorization, provenance minimization, and shared accessibility/SEO/error contracts.
4. Unknown `templateKey` values fail closed (404/setup), never fall back to Explorer silently in Production.
5. Tenant `brandColors` may theme safely; layout/typography differences that cannot be expressed as tokens live in template components, not arbitrary CMS HTML.

## Consequences

- Template selection happens after tenant resolution and published checks.
- Shared data helpers remain the single public-read path for both templates.

## Clarification (2026-08-25) — S6-4 Product Director direction

Product Director chose option **(a)**: `summit` must have real layout/typography differences in
template components, not be reclassified as a colour-token theme of Explorer. Point 5 already places
layout differences that cannot be expressed as tokens in template components; a tokens-only ship is
incomplete against that intent. Implementation lives under `src/components/templates/` (Explorer vs
Summit homepage shells, summit nav order, and summit-specific CSS structure). Do not amend this ADR
to call summit a theme variant.
