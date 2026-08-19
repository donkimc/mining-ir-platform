# ADR-0012: AI-Assisted Content Disclosure and Provenance

## Status

Accepted for Sprint 5 (2026-08-18) — schema and reviewer controls land in Sprint 5; live external extraction remains deferred per ADR-0013.

## Context

ADR-0004 requires human approval before technical disclosure is published. Sprints 1–4 recorded **who** approved a record (`reviewedBy` / `reviewedAt`) but not **where the content came from**. Machine-assisted drafts change the threat model: a reviewer can approve plausible-looking errors (wrong grade, hole ID or units) without knowing the text was machine-proposed.

## Decision

1. Every disclosure-bearing publishable record carries a server-controlled `contentOrigin` enum: `human_authored` | `machine_assisted`. Existing records default to `human_authored`.
2. Origin and provenance fields are **server-derived**. Company Admins cannot set, clear, forge or downgrade them through ordinary create/update (including forging `machine_assisted` → `human_authored`).
3. When content becomes machine-assisted, the server sets `originLockedAt` and retains extraction audit fields (`extractionRunId`, `extractionProvider`, `extractionModel`, `extractionModelVersion`, `extractedAt`) and source linkage (`sourceDocument`, `sourceLocation`, `provenanceClaims`).
4. Machine-assisted records still require the existing status-only `Review → Published` transition. Combined content-edit + `status=published` remains rejected.
5. Machine-assisted approval additionally requires a server-stamped source acknowledgement (`reviewerSourceCheckBy` / `reviewerSourceCheckAt`) on the same status-only approval request. Missing acknowledgement rejects the transition.
6. Anonymous public serializers omit all provenance, extraction and reviewer-source-check fields (in addition to existing review metadata and tenant internals).
7. Raw confidential source excerpts are never stored in public fields and never written to logs, errors or telemetry.

## Field authority

| Field | Setter | Company Admin mutable? | Anonymous public? |
| --- | --- | --- | --- |
| `contentOrigin` | Server only | No | No |
| `originLockedAt` | Server only | No | No |
| `sourceDocument` / `sourceLocation` / `provenanceClaims` | Server extraction or controlled ingestion | No downgrade/deletion for machine content | No |
| Extraction audit fields | Server only | No | No |
| `reviewerSourceCheckBy` / `reviewerSourceCheckAt` | Server status-only approval | No | No |

## Consequences

- Schema migration is required before any machine-assisted fixture can be stored.
- Reviewer UI (ADR-0015) must surface origin, source location and diffs before approval.
- Future live extraction may only write Draft proposals through the server adapter boundary (ADR-0013 / ADR-0014).
