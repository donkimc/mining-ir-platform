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

## Sprint 5 — Automation ✅ Complete (reviewed 2026-08-19)

Document ingestion, provenance/machine-origin marking, reviewer source-verification UI, and fixture-only extraction adapter. **No external LLM egress** (ADR-0013). Reviewed in `docs/SPRINT5_REVIEW.md` (Ship with conditions); remediations landed in `359a9ce`. See also `docs/SPRINT5_HANDOFF.md`.

**Governing constraint.** This is the first sprint where machine-generated text can enter the disclosure pipeline. Per ADR-0004, technical mining disclosure must not reach Published from AI-generated content without human review. Provenance fields and reviewer acknowledgement are required (ADR-0012, ADR-0015).

**Also required before any live extraction:** a decision on whether unpublished tenant documents may be sent to an external LLM provider (ADR-0013 — Sprint 5 decision: no external egress).

Carried in and addressed: schema migrate of `bwftfsfbiyzgwztwtqmh`, deployed-env `PAYLOAD_DATABASE_PUSH=false` operator observation, and S4-3 / S4-4 / S4-5. The Vercel cutover to that database completed in Sprint 6.

## Sprint 6 — Real-Domain Go-Live ✅ Complete (reviewed 2026-08-24)

Fixture identity rename to coined, registry-checked names; `nrlaunch.com` hostname routing with a
marketing apex and fail-closed unknown/reserved hosts; an admin-host session boundary; a second
presentation template; a `company_listings` collection; and Production cutover to Supabase
`bwftfsfbiyzgwztwtqmh`.

Decisions: ADR-0016 (hostname routing), ADR-0017 (summit template), ADR-0018 (admin-host sessions),
ADR-0019 (company listings), ADR-0020 (Production cutover / smoke gate), ADR-0021 (fixture identity
clearance).

### Sprint 6 Exit Criteria — met

- Apex and `www` serve platform marketing and never resolve as a tenant; `www` redirects in one hop.
- Tenant subdomains resolve their own tenant; reserved labels, unknown labels and the old
  `*.vercel.app` alias return 404 with no `DEFAULT_TENANT_SLUG` fallback.
- Authenticated surfaces live only on `admin.nrlaunch.com`; tenant hosts redirect to it.
- Three fictional tenants live; anonymous reads on every host return that tenant's Published records
  only, with no reviewer, provenance, tenant or template internals.
- Production storage bucket private; cross-tenant media returns 403.
- Retired fixture identities absent from active code, seed and living docs, guarded in CI.
- Lint, typecheck, tests, migration-drift, retired-fixtures and `build:ci` green on the remediation
  candidate (`npm run verify` exit 0; 125 tests / 21 files as of 2026-08-25 remediations).

### Sprint 6 open findings — carry to Sprint 7

Closed 2026-08-25: **S6-7**, **S6-1**, **S6-2**, **S6-3** (see `docs/SPRINT6_HANDOFF.md` remediation
section). Still open from `docs/SPRINT6_REVIEW.md`: **S6-4** summit is a colour variant, not a
distinct shell; **S6-5** multi-listing schema has no multi-listing fixture; **S6-6** a live document
links to an unrelated third-party site.

## Sprint 7 — Not yet scoped

Candidate inputs: remaining Sprint 6 findings S6-4/5/6; `docs/SPRINT7_FEATURE_NOTES.md` (role-separated
disclosure approval — Editor versus Approver, which would strengthen ADR-0004 by making the author and
the approver distinct people); and the remaining customer-content promotion gates (Production restore
rehearsal, deployed-environment variable observation, rollback exercise, live regression after the
remediation deploy).

Customer content remains blocked until the Product Director signs off on the remaining promotion
gates (Production restore rehearsal, deployed env observation, rollback, live regression after this
remediation deploy). S6-7/1/2/3 are closed; S6-4/5/6 are backlog unless Product Director requires them
for demos.

## Later

Billing, custom domains, provisioning automation, regulatory integrations and investor assistant features.

**Role-separated disclosure approval (Editor vs Company Admin publish):** behavioral notes for an upcoming sprint — `docs/SPRINT7_FEATURE_NOTES.md` (not a plan; for planners to pick up).
