# Roadmap

## Sprint 0 — Foundation

Product direction, MVP boundary, personas, IA, UX, architecture, data model, security assumptions, backlog and working agreements.

## Sprint 1 — Vertical Slice

Aurora Gold tenant, Explorer Home/Projects/Project Detail, Company Admin editing, minimal Platform Admin control, publication rules, tenant isolation and repository documentation.

## Sprint 2 — Mining Content

News releases, documents, presentations, management, share structure, exploration content and richer disclosure review. Preserve the Sprint 1 tenant, publication and authorization foundations.

### Sprint 2 Exit Criteria

- All five content workflows are usable by Company Admin.
- Published-only public Explorer sections work for Aurora Gold.
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

## Sprint 4 — Investor Features

Market data, analytics, subscriptions, maps and richer investor workflows.

## Sprint 5 — Automation

Document ingestion, AI-assisted extraction and human approval workflow improvements.

## Later

Billing, custom domains, provisioning automation, regulatory integrations and investor assistant features.
