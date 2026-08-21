# Roadmap

## Sprint 0 — Foundation

Product direction, MVP boundary, personas, IA, UX, architecture, data model, security assumptions, backlog and working agreements.

## Sprint 1 — Vertical Slice

Qelvarion Resource tenant, Explorer Home/Projects/Project Detail, Company Admin editing, minimal Platform Admin control, publication rules, tenant isolation and repository documentation.

## Sprint 2 — Mining Content

News releases, documents, presentations, management, share structure, exploration content and richer disclosure review. Preserve the Sprint 1 tenant, publication and authorization foundations.

### Sprint 2 Exit Criteria

- All five content workflows are usable by Company Admin.
- Published-only public Explorer sections work for Qelvarion Resource.
- Cross-tenant and review-gate tests cover every collection.
- Source context is visible for material claims.
- Sprint 1 regression suite remains green.

## Sprint 3 — Production Hardening & Investor Readiness

Close the release-blocking findings from the Sprint 2 independent review: private storage, credential rotation, verified TLS, incremental migration safety, real cloud media testing, production guards, public API minimization, committed remediation and operational recovery.

### Sprint 3 Exit Criteria

- No direct public storage path can expose unpublished or unauthorized media.
- All exposed secrets are rotated and old sessions are invalidated.
- Preview and Production require verified database TLS and controlled migrations.
- An older-schema upgrade and non-production restore rehearsal are evidenced.
- Cloud media behavior is verified with a real fictional file.
- Full tenant-isolation, review-gate and public-serializer regressions pass.
- The exact release candidate is committed, reviewed and verified on Vercel Pro Preview with Supabase Pro staging.

## Sprint 4 — Investor Features ✅ Complete (reviewed 2026-08-17)

Public Explorer search/filtering over Published content, related published-content navigation, read-only project maps from existing coordinates with an accessible text fallback, and the Sprint 3 carry-in fixes (M-1, L-1, L-2, L-3, N3, N4).

Market data, analytics and subscriptions were assessed and deliberately deferred — `AGENTS.md` keeps live quotes out of MVP scope, and subscriptions would introduce investor PII without a privacy ADR. Recorded in ADR-0009.

### Sprint 4 Exit Criteria — met

- Anonymous `/api/companies` returns only the resolved tenant, with no platform-internal fields.
- The public serializer strips reviewer metadata and tenant IDs across every tenant-owned collection.
- Zenthoriq Resource negative fixtures exist and never appear in Qelvarion HTML, JSON, metadata or maps.
- Published-only discovery: search, filters, empty states and related content exclude Draft, Review, Archived and other tenants.
- Maps render only for Published, same-tenant records with valid coordinates; failure degrades to accessible text; no map API keys in client output.
- Staging restore rehearsal performed and recorded.
- No new tenant-owned collection, no migration, no investor PII, no market-data dependency.
- Independent review closed all Critical and High findings.

## Sprint 5 — Automation

Document ingestion, provenance/machine-origin marking, reviewer source-verification UI, and fixture-only extraction adapter. **No external LLM egress** (ADR-0013). Implementation is on `main`; independent review is pending. See `docs/SPRINT5_HANDOFF.md`.

**Governing constraint.** This is the first sprint where machine-generated text can enter the disclosure pipeline. Per ADR-0004, technical mining disclosure must not reach Published from AI-generated content without human review. Provenance fields and reviewer acknowledgement are required (ADR-0012, ADR-0015).

**Also required before any live extraction:** a decision on whether unpublished tenant documents may be sent to an external LLM provider (ADR-0013 — Sprint 5 decision: no external egress).

Carried in and addressed in implementation: schema migrate of `bwftfsfbiyzgwztwtqmh` (Vercel alias still on staging), deployed-env `PAYLOAD_DATABASE_PUSH=false` operator observation, and S4-3 / S4-4 / S4-5.

## Later

Billing, custom domains, provisioning automation, regulatory integrations and investor assistant features.
