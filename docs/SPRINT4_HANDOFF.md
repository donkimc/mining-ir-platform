# Sprint 4 Handoff — Investor Features

## Status

**Implementation complete on commit `f068fc3` — not marked Done.** Local `npm run verify` passed. Staging-backed Vercel alias shows Sprint 4 behavior. Independent review and L-3 live PITR UI evidence are still required before Sprint 4 is marked complete or real customer content is loaded.

Product Director authorized implementation via the Sprint 4 task (overrides the earlier planning-only gate in this document).

## Sprint Goal

Make the Explorer website more useful for prospective investors through trustworthy public content discovery and a simple project-location experience, while closing the remaining Sprint 3 findings and preserving tenant isolation, published-only reads and human approval for disclosure-sensitive content. Sprint 4 must remain a public, unauthenticated investor experience; it does not introduce investor accounts, market-data contracts or stored investor PII.

## Non-Goals

- AI extraction, automated ingestion or automatic publication.
- SEDAR+ or other regulatory integrations.
- Billing, custom domains, self-serve provisioning or new templates.
- Investor accounts, CRM, saved portfolios or personalized dashboards.
- Live stock quotes or market-data licensing in this sprint.
- Investor analytics, valuation models, recommendations or predictive scoring.
- Email subscriptions, investor notifications or storage of investor email addresses.
- Advanced GIS, drill-hole visualization, 3D maps, polygon layers or offline maps.
- Production customer-content loading before the real production database is migrated and restored successfully.

## Scope Decisions

| Candidate | Sprint 4 decision | Rationale |
| --- | --- | --- |
| Market/stock data display | **OUT** | `AGENTS.md` explicitly lists live quotes as out of MVP scope. Adding a paid external dependency, caching, rate limits, attribution/licensing and disclosure policy would be a separate product decision. Revisit in a later sprint through an ADR. |
| Investor-facing analytics | **OUT** | Analytics would require metric definitions, event/privacy decisions, tenant boundaries and a meaningful data volume. It is not required to prove a safe investor website. |
| Email subscriptions / notifications | **OUT** | This introduces investor PII, consent, retention, unsubscribe, delivery failures and tenant ownership. It should not enter the data model without a dedicated privacy and notification ADR. |
| Project maps | **IN, narrow slice** | Projects already have latitude/longitude and Sprint 1 has only a placeholder. Add a read-only map for published project coordinates, with no advanced GIS or technical interpretation. |
| Richer public Explorer workflows | **IN, narrow slice** | Improve investor discovery using published-only search/filtering, related content links, project context and source links. Keep it anonymous and avoid a new account system. |

### Scope conflict and recommendation

The roadmap names Sprint 4 “Investor Features,” but `AGENTS.md` keeps live stock quotes out of MVP. This plan does not silently override that constraint. The recommendation is to ship maps and public content discovery first; market data remains OUT until the Product Director approves a separate ADR covering provider, licensing, caching, cost, outages and disclosure treatment.

## Carry-In Findings

These are already diagnosed in `docs/SPRINT3_REVIEW.md`. Sprint 4 schedules the fixes; it does not re-investigate them.

| Finding | Priority | Planned treatment | Migration |
| --- | --- | --- | --- |
| M-1: anonymous `/api/companies` lists every tenant and internal fields | Medium; Week 1 | Resolve the request tenant before anonymous reads and strip `websiteDomain`, `subdomain`, `templateKey`, internal IDs and any non-public profile fields. Preserve Platform Admin cross-tenant listing. | No |
| L-1: public serializer does not strip tenant IDs | Low; Week 1 | Align the implementation and written specification. Strip tenant IDs from anonymous responses unless a specific public contract intentionally requires one. | No |
| L-2: staging lacks Northern Copper projects/highlights/catalysts | Low; Week 1 | Add negative-case staging/local fixtures with distinctive poison values and assert they never appear on Aurora public routes or APIs. | No |
| L-3: Supabase PITR/restore UI rehearsal not verified | Low; Week 1 | Perform the documented non-production restore rehearsal before real customer content. Record project, timestamp, method and smoke results. | No |
| N3: inert relation-error mapping in `publishing.ts` | Optional carry-in | Correct the exception ordering only if it improves the existing error contract without changing authorization behavior; add a focused regression test. | No |
| N4: anonymous media access materializes up to 1000 IDs | Optional carry-in | Replace the capped ID materialization with a bounded, indexed relation/status query or an equivalent authorization query. Prove behavior beyond 1000 records if the implementation changes. | No |

## Ordered Work Breakdown

### 1. Close Sprint 3 carry-ins and establish negative fixtures

**Timing:** Week 1, before investor-feature work.

**Rationale:** M-1 is the last known cross-tenant public inconsistency. L-2 shows that isolation tests without a second-tenant record can pass trivially. These are prerequisites for trusting every new public Explorer surface.

**Likely files/areas:**

- `src/collections/Companies.ts`
- `src/lib/collection-hooks.ts`
- `src/lib/public-data.ts`
- `src/lib/publishing.ts`
- `tests/sprint3-public-api.int.spec.ts`
- `tests/tenant-isolation.int.spec.ts`
- `tests/storage-privacy.spec.ts`
- seed/test-fixture files and `docs/SPRINT3_REVIEW.md` evidence notes

**Migration:** No, unless implementation discovers an actual schema change. Do not create an empty migration merely to satisfy the checklist.

**Risk:** High if anonymous reads remain broad; a defect can expose another company's profile or platform-routing metadata. No new feature should be merged until the risk is covered by a Northern Copper fixture.

**Acceptance criterion:** On a deployed staging environment, an anonymous request to the Aurora origin returns only the resolved tenant's intentional public fields; the response contains no Northern Copper values, no platform-internal fields and no tenant-management metadata. The same result is proven by an automated fixture containing a distinctive Northern value.

### 2. Complete Supabase PITR/restore rehearsal

**Timing:** Week 1.

**Rationale:** The application and migration rollback paths are tested, but the hosted database restore procedure is not evidence until performed.

**Likely files/areas:**

- `docs/OPERATIONS.md`
- `docs/DEPLOYMENT.md`
- `docs/SPRINT3_REVIEW.md`
- `docs/SPRINT4_HANDOFF.md`

**Migration:** No application migration. Use a non-production Supabase restore/branch/project only.

**Risk:** Operational rather than tenant-isolation risk. Do not touch the real production project or real customer content.

**Acceptance criterion:** A non-production restore is performed from the Supabase UI or supported restore mechanism, followed by `npm run migrate` if required and smoke checks for the public site, Company Admin login, tenant isolation and one Published media file. Evidence includes project reference, timestamp, restore method and results without secrets.

### 3. Define and implement the public Explorer discovery contract

**Timing:** Week 1–2.

**Rationale:** Investors need to find published information across projects and mining content without accounts. A server-side published-only contract is safer than broad client-side fetching.

**In:** Search/filter by approved public fields, stable ordering, content-type filters, project/category filters where already modeled, related published content, source links and intentional empty/not-found states.

**Out:** Saved searches, personalization, investor accounts, recommendations, full-text search infrastructure and analytics tracking.

**Likely files/areas:**

- `src/lib/public-data.ts`
- `src/lib/seo.ts`
- `src/app/(frontend)/projects/page.tsx`
- `src/app/(frontend)/projects/[slug]/page.tsx`
- `src/app/(frontend)/news/page.tsx`
- `src/app/(frontend)/documents/page.tsx`
- `src/app/(frontend)/management/page.tsx`
- `src/app/(frontend)/share-structure/page.tsx`
- any new shared public filter/navigation components
- `tests/sprint3-public-api.int.spec.ts` and new public Explorer tests

**Migration:** No, provided the feature uses existing fields and bounded queries. A migration is required if search indexes or new persisted fields are introduced.

**Risk:** High if the query fetches broad collections and filters in React, leaks Draft/Review rows, crosses tenants or exposes reviewer/tenant IDs. Public queries must resolve one tenant server-side and filter `Published` at the data query.

**Acceptance criterion:** On Preview, a public visitor can filter or navigate to published Projects, News and Documents for the resolved Aurora tenant; Draft, Review, Archived and Northern Copper fixtures are absent from HTML, metadata and JSON. Empty and invalid-filter states are intentional and do not disclose record existence.

### 4. Add narrow read-only project maps

**Timing:** Week 2.

**Rationale:** Project coordinates already exist and the Sprint 1 placeholder leaves a clear investor-facing gap. A map can help orientation without implying technical conclusions.

**In:** One project marker or a small set of published project markers, jurisdiction/location summary, accessible list fallback, link to the project detail page, and a clear “illustrative location” label where precision is limited.

**Out:** Drill-hole layers, claims boundaries, geological interpretations, 3D, GIS editing, route planning, technical survey data and map-based disclosure authoring.

**Likely files/areas:**

- `src/collections/Projects.ts` only if validation or public field selection needs adjustment
- `src/app/(frontend)/projects/page.tsx`
- `src/app/(frontend)/projects/[slug]/page.tsx`
- new map component under `src/components/` or equivalent
- `src/lib/public-data.ts`
- `docs/DESIGN.md`, `docs/ARCHITECTURE.md`
- map and public rendering tests

**Migration:** No if latitude, longitude and existing project fields are reused. If a provider-specific place ID, map configuration or persisted map metadata is proposed, stop and create a migration plus ADR first.

**Risk:** Medium. Coordinates are tenant-owned and may be sensitive or inaccurate. Never render Draft/Review projects, expose another tenant's coordinates, or imply that a marker is a technical survey result.

**Acceptance criterion:** On a deployed Preview, a Published Aurora Gold project with valid coordinates renders one accessible marker and an equivalent text location; a Draft project, a Northern Copper project and a project with invalid/missing coordinates render no unauthorized marker and no error leak. Map failure falls back to text without blocking the page.

**Open Product Director question:** Which map provider, if any, is approved, and what budget/licensing terms are acceptable? The repository mentions Mapbox as a later direction but does not approve a provider or API-key policy. Cursor must not choose a paid provider silently.

### 5. Review disclosure, privacy and performance contracts

**Timing:** Week 2–3.

**Rationale:** New public discovery and maps increase the amount of content exposed to anonymous visitors. The existing disclosure gate must remain the source of truth.

**Likely files/areas:**

- `src/lib/collection-hooks.ts`
- `src/lib/publishing.ts`
- `src/lib/public-data.ts`
- `src/lib/seo.ts`
- `docs/SECURITY.md`, `docs/DATA_MODEL.md`, `docs/TESTING.md`
- relevant public route tests

**Migration:** No unless a persisted audit/search/map field is added.

**Risk:** High. Search, related-content joins, metadata generation and map data can each become an accidental Draft/Review or cross-tenant side channel.

**Acceptance criterion:** A test matrix proves every new public query and metadata path returns only Published records for the resolved tenant, strips reviewer metadata and non-public tenant fields, rejects cross-tenant relations, and preserves status-only approval behavior. The same checks run against a committed build and a deployed Preview.

### 6. Production promotion to the real Supabase project

**Timing:** After Sprint 4 implementation review, before real customer content.

**Rationale:** The real production project `bwftfsfbiyzgwztwtqmh` is empty. Promotion must be a controlled migration and configuration exercise, not a schema push or an implicit Vercel variable copy.

**Likely files/areas:**

- `docs/DEPLOYMENT.md`
- `docs/OPERATIONS.md`
- `docs/SPRINT4_HANDOFF.md`
- Vercel project settings and Supabase project settings

**Migration:** Yes, application migrations only. Run `npm run migrate`; never run Payload push against the real project.

**Risk:** Critical operational risk if the wrong environment variables or database are selected. It must not change tenant or publication rules.

**Acceptance criterion:** The production project has the expected schema after `npm run migrate`, `PAYLOAD_DATABASE_PUSH=false` or absent, a project-specific `DATABASE_SSL_CA`, correct project-specific storage credentials, no Preview-only variable dependency, and a successful smoke test before any customer content is loaded.

## Data Model and Migration Strategy

### Recommended Sprint 4 data changes

The recommended slice requires no new tenant-owned collection and no new investor-PII collection:

- Reuse `Projects.latitude`, `Projects.longitude`, `Projects.locationSummary`, `tenant`, `status` and existing public content relations.
- Reuse existing News, Documents, People, Share Structure and Exploration fields for discovery and related-content navigation.
- Do not add `Investor`, `Subscription`, `MarketQuote`, `AnalyticsEvent` or `Notification` records in Sprint 4.
- Do not persist search queries, visitor identifiers, email addresses or map-provider-specific secrets in the database.

### Migration policy

If implementation proves that a database index is needed for bounded public queries, add an additive Payload migration in the same commit as the schema/index change, run migration drift CI, rehearse it from the Sprint 3 schema and record rollback/forward-recovery behavior. If the map provider requires persisted fields or a new public contract, stop implementation and update the data model and an ADR before coding.

Any future tenant-owned collection must include tenant scope, publication/review controls where disclosure-bearing, public serialization, cross-tenant relation checks, Northern Copper negative fixtures and a generated migration in the same commit.

## New ADRs Required

| ADR | Decision it must record | When required |
| --- | --- | --- |
| ADR-0009 — Sprint 4 investor-feature boundary | Maps and anonymous public discovery are IN; market data, analytics and subscriptions are OUT; record the conflict with the MVP constraint. | Before implementation begins |
| ADR-0010 — Project map provider and data policy | Provider or provider-neutral approach, API-key exposure, cost/quotas, attribution, fallback, coordinate precision, privacy and accessibility. | Required if a third-party map is selected |
| ADR-0011 — Public Explorer discovery contract | Supported filters, query bounds, ordering, caching/revalidation, serializer fields and confirmation that no visitor PII is stored. | Before search/filter implementation |
| Future subscription ADR | Consent, tenant ownership, retention, unsubscribe, processor, delivery and breach handling. | Only if subscriptions are reconsidered |
| Future market-data ADR | Provider/licence, quote delay, caching, rate limits, cost, outage behavior, attribution and disclosure obligations. | Only if market data is reconsidered |

## Test Plan

### Carry-in regression tests

- Anonymous `/api/companies` returns only the resolved tenant's public profile.
- Anonymous company responses omit `websiteDomain`, `subdomain`, `templateKey`, internal IDs and tenant IDs unless explicitly public.
- Aurora fixtures contain Northern Copper poison values for Projects, Investment Highlights and Catalysts.
- Public HTML, metadata, JSON and map data never contain Northern poison values.
- `publishing.ts` relation-error behavior is covered if N3 is fixed.
- Media authorization remains correct beyond the previous 1,000-record query boundary if N4 is fixed.

### Discovery tests

- Published Aurora records are returned for valid filters and stable ordering.
- Draft, Review and Archived records are absent from list, detail, metadata and API responses.
- Northern Copper matching records are absent from Aurora results.
- Invalid, empty and overly broad filters are bounded and produce intentional states.
- Related-content links cannot cross tenants or reveal non-published records.
- No reviewer IDs, review timestamps, tenant-management fields or visitor identifiers are returned.

### Map tests

- Published valid coordinates render a marker and accessible text fallback.
- Draft, Review, Archived, wrong-tenant and invalid-coordinate records render no marker.
- Map provider failure renders the text location and does not fail the page.
- API keys are not exposed in server responses unless the selected provider explicitly requires a restricted public key and its ADR approves that design.
- Mobile and desktop layouts remain usable; keyboard users can reach the project link and fallback content.

### Production and evidence tests

- Run `npm run verify` on the exact committed release candidate.
- Run migration-drift CI and any new migration rehearsal against a disposable non-production database.
- Verify the real production project `bwftfsfbiyzgwztwtqmh` with `DATABASE_SSL_CA` and `PAYLOAD_DATABASE_PUSH=false` before content loading.
- Record a deployment observation for the Vercel Production environment; do not infer it from Preview variables.
- Repeat the public isolation and disclosure matrix on the deployed Preview and, after promotion, on Production with only fictional smoke data.

## Production Promotion Plan

1. Keep the Vercel production alias on the reviewed staging-backed configuration until Sprint 4 code and review are complete.
2. Confirm the Supabase production project `bwftfsfbiyzgwztwtqmh` is the intended empty project. Record the project reference without credentials.
3. Configure Production environment variables explicitly in Vercel. Remember that Preview and Production variables are separate; a Preview variable does not reach a Production build. Prefer deliberate per-environment entries and verify them from the deployment configuration.
4. Set the production `DATABASE_URI` for the real project, the project-specific `DATABASE_SSL_CA`, `PAYLOAD_DATABASE_PUSH=false` or absent, production `PAYLOAD_SECRET`, and production storage credentials. Never copy staging secrets into documentation or chat.
5. Run `npm run migrate` against the real project. Never run Payload schema push and never run `seed:reset` there.
6. Confirm the migration result, TLS behavior, storage privacy, production guards, authentication and public Published-only routes.
7. Perform or document the Supabase PITR/restore rehearsal before loading customer content.
8. Load only fictional Aurora Gold smoke data first. Verify Company Admin access, Platform Admin separation, one Published document, one Draft document, one map and Northern Copper negative fixtures where available.
9. Deploy the exact committed release candidate and record the Vercel deployment, commit, environment, Supabase project and smoke results.
10. Product Director decides whether to promote or keep the alias on staging. No customer data is loaded until all Critical/High findings are closed and the independent reviewer confirms the evidence.

## Exit Criteria

- M-1 is fixed and independently verified on a deployed environment.
- L-1 is resolved by code and specification agreement.
- L-2 fixtures exist in staging or an equivalent persistent non-production fixture and are used by isolation tests.
- L-3 Supabase restore rehearsal is completed and recorded.
- N3 and N4 are either fixed with evidence or explicitly deferred with rationale and risk acceptance.
- Public Explorer discovery works for Published Aurora content and excludes Draft, Review, Archived and Northern Copper content from HTML, metadata, JSON and related links.
- Project maps work for valid Published coordinates, have an accessible text fallback, and fail gracefully without exposing secrets or unauthorized coordinates.
- No new investor PII, market-data dependency or tenant-owned collection is introduced.
- `npm run verify`, migration-drift checks and any migration rehearsal pass on the exact committed release candidate.
- Preview evidence proves the deployed behavior; local tests are not used as a substitute.
- The real production project is migrated with `npm run migrate`, never push; TLS CA and `PAYLOAD_DATABASE_PUSH=false` are verified per project.
- Restore/recovery evidence is recorded before real customer content.
- Independent review classifies findings using ADR-0008's Evidence Standard, and no Critical/High issue remains open or explicitly accepted by the Product Director.

## Open Questions for the Product Director

1. Approve the recommended narrow slice: maps plus public Explorer discovery, with market data, analytics and subscriptions deferred?
2. If maps are approved, which provider and monthly budget/licensing constraints apply? Is a provider-neutral text fallback sufficient if no provider is approved?
3. Should optional N3 and N4 be included in Sprint 4 implementation or explicitly accepted as carry-forward items?
4. After the restore rehearsal, should the production alias be pointed to the real empty project immediately, or remain staging-backed until a separate go-live decision?

## Independent Review Handoff

Give the reviewer the exact committed Preview URL, commit SHA, changed-file list, commands and results, deployment environment, Supabase project reference, migration evidence, restore evidence, map provider/configuration evidence and negative-case fixture evidence.

Use this request:

> Review the Mining IR Platform Sprint 4 release candidate against `AGENTS.md`, `docs/SPRINT4_HANDOFF.md`, `docs/SPRINT3_REVIEW.md`, `docs/SECURITY.md`, `docs/TESTING.md`, `docs/OPERATIONS.md`, `docs/DEPLOYMENT.md`, ADR-0004, ADR-0007 and ADR-0008. Follow ADR-0008's Evidence Standard: verify claims with reproducible commands, deployment observations, infrastructure settings or test fixtures. Prioritize M-1 tenant leakage, public serializer scope, Northern Copper negative fixtures, published-only discovery, cross-tenant related content, unauthorized map coordinates, API-key exposure, disclosure-gate regressions, migration safety, TLS, Vercel environment separation and restore evidence. Classify findings as Critical, High, Medium or Low, include reproduction steps and affected files/routes, and do not recommend customer-content promotion while a Critical or High issue remains open.

## Completion Report

Filled 2026-08-16 after commit `f068fc3`.

- **Product Director scope decision:** Maps + anonymous public discovery IN; market data, analytics and subscriptions OUT (ADR-0009). Optional N3/N4 included.
- **Map provider/ADR decision:** Provider-neutral OpenStreetMap embed, no API key (ADR-0010). Paid Mapbox/Google deferred for Product Director.
- **Commit SHA:** `f068fc3f83fcb15d41108c46c4c552057ce28cff`
- **Changed files (implementation commit):**
  - Access/serializer: `src/access/index.ts`, `src/lib/collection-hooks.ts`, `src/lib/publishing.ts`, `src/collections/Media.ts`
  - Public data/UI: `src/lib/public-data.ts`, `src/components/public/ProjectLocationMap.tsx`, `src/components/public/PublicDiscoveryFilters.tsx`, `src/app/(frontend)/projects/page.tsx`, `src/app/(frontend)/projects/[slug]/page.tsx`, `src/app/(frontend)/news/page.tsx`, `src/app/(frontend)/documents/page.tsx`
  - Seed/tests: `src/seed/index.ts`, `tests/sprint3-public-api.int.spec.ts`, `tests/sprint2-content.int.spec.ts`, `tests/tenant-isolation.int.spec.ts`, `tests/publishing.spec.ts`
  - Docs/ADRs: `docs/SPRINT4_HANDOFF.md`, `docs/SPRINT3_REVIEW.md`, `docs/OPERATIONS.md`, `docs/SECURITY.md`, `docs/TESTING.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, ADR-0009/0010/0011
- **Migration files and drift result:** No new migration (no schema change). `npm run check:migration-drift` — pass.
- **`npm run verify` result:** Pass locally (`lint`, `typecheck`, `test` 76/76, `check:migration-drift`, `build:ci`).
- **M-1/L-1/L-2/L-3/N3/N4 results:**
  - **M-1:** Fixed — anonymous companies read resolves one tenant; live `/api/companies` returns 1 doc (`aurora-gold`) without platform fields.
  - **L-1:** Fixed — anon serializer strips `tenant`, `websiteDomain`, `subdomain`, `templateKey` (+ review fields). Relation checks use `context.skipPublicSerializer`.
  - **L-2:** Fixed in seed — Northern project, `NORTHERN SECRET` highlight, `NORTHERN CATALYST SECRET` catalyst + poison coordinates; covered by tests. Live APIs show no Northern poison titles.
  - **L-3:** Checklist documented in `docs/OPERATIONS.md`. **Live Supabase PITR UI rehearsal evidence still pending** operator dashboard access — not claimed complete.
  - **N3:** Fixed — only rethrow `APIError` with status 400; unit coverage added.
  - **N4:** Fixed — anonymous media ID materialization scoped to resolved tenant only.
- **Preview URL and Vercel environment:**
  - Staging alias (Vercel **Production** target backed by Supabase **staging**): https://mining-ir-platform.vercel.app
  - Deployment observed serving Sprint 4 UI: `dpl_3o4HCk6uT3oF9W9wtkyAurGV4zn1` / https://mining-ir-platform-19w9n5mbi-donkimc.vercel.app (aliases include `mining-ir-platform.vercel.app` and `mining-ir-platform-git-main-donkimc.vercel.app`)
  - Git push of `f068fc3` to `main` triggered this deploy.
  - CLI `vercel` **Preview** env deploy **failed** (`password authentication failed for user "postgres"`) — Preview env `DATABASE_URI` needs operator repair; do not treat that failed Preview URL as evidence.
- **Production Supabase project reference:** empty real Production project `bwftfsfbiyzgwztwtqmh` (unchanged; no customer content). Staging/ref used by alias: `jthotkkremiesvocfsmr`.
- **`DATABASE_SSL_CA` verification:** Relies on Sprint 3 Production/Preview env configuration (not re-rotated this sprint). Not re-observed from CLI secrets.
- **`PAYLOAD_DATABASE_PUSH` verification:** Local `build:ci` forces `PAYLOAD_DATABASE_PUSH=false`. Deployed env expected absent/false per Sprint 3; not re-dumped from Vercel secrets here.
- **Restore rehearsal evidence:** Procedure updated; **live UI restore not performed** in this session — L-3 remains evidence-pending.
- **Northern Copper negative-case evidence:**
  - Local tests assert fixtures exist and never appear on anon Aurora reads.
  - Live: `/projects/copper-ridge-isolation` → 404; `/projects/hidden-lake` → 404; `/api/catalysts` and `/api/investment-highlights` titles contain no Northern poison; search `q=NORTHERN SECRET` → empty state (query echo only in the form value).
- **Map and discovery evidence (live alias):**
  - `/projects` shows filter form; `q=Ridge` returns North Ridge only among matches.
  - `/projects/north-ridge` shows “Location map”, “Illustrative location”, OpenStreetMap embed attribution; no Mapbox/Google keys in HTML.
  - Related published content section present.
  - `/api/companies` minimized fields as above.
- **Independent review result:** **Not run yet.** Use the review request in this document against commit `f068fc3` and https://mining-ir-platform.vercel.app.
- **Deferred work and accepted risks:**
  - L-3 live PITR/restore UI evidence.
  - Repair Vercel Preview-environment `DATABASE_URI` (CLI Preview builds fail auth).
  - Paid map provider decision (optional later ADR-0010 amendment).
  - Sprint 5+: market data, analytics, subscriptions, investor accounts, AI/SEDAR+, real Production promotion of `bwftfsfbiyzgwztwtqmh`.
  - Sprint 4 is **not** marked complete until independent review clears Critical/High and L-3 evidence is recorded.

### Completion Report Template (checklist form)

- Product Director scope decision: **Yes — narrow Sprint 4 slice authorized**
- Map provider/ADR decision, or documented deferral: **ADR-0010 OSM embed / no paid key**
- Commit SHA: **`f068fc3`**
- Changed files: **see list above**
- Migration files and drift result: **none / pass**
- `npm run verify` result: **pass**
- M-1/L-1/L-2/L-3/N3/N4 results: **M-1/L-1/L-2/N3/N4 fixed; L-3 docs-only pending live evidence**
- Preview URL and Vercel environment: **staging alias https://mining-ir-platform.vercel.app (`dpl_3o4HCk6uT3oF9W9wtkyAurGV4zn1`); CLI Preview failed**
- Production Supabase project reference: **`bwftfsfbiyzgwztwtqmh` (empty)**
- `DATABASE_SSL_CA` verification: **not re-dumped; Sprint 3 config assumed**
- `PAYLOAD_DATABASE_PUSH` verification: **local build:ci false; deployed assumed false**
- Restore rehearsal evidence: **pending**
- Northern Copper negative-case evidence: **local + live smoke pass**
- Map and discovery evidence: **live smoke pass**
- Independent review result: **pending**
- Deferred work and accepted risks: **see above**

## S4-1 / S4-2 remediation (post-review)

**Date:** 2026-08-16  
**Review:** `docs/SPRINT4_REVIEW.md` (Ship with conditions; S4-1 High, S4-2 Medium)

### Fixes
- **S4-1a:** Added `frame-src https://www.openstreetmap.org` to CSP (`src/lib/content-security-policy.ts` → `next.config.ts`). No wildcards; no other directives loosened.
- **S4-1b:** Chromium probe showed CSP-blocked / unreachable iframes fire **neither** `error` nor `load`; successful OSM embeds fire `load`. Implemented a **5s load-timeout** cleared on `load`/`error`, plus retained manual Hide control. Removed `loading="lazy"` so the timeout does not race a deferred below-the-fold fetch.
- **S4-2:** Media `afterRead` composes `serializeAnonymousPublicDoc` for anonymous callers (respects `context.skipPublicSerializer` for relation checks). Anonymous reads force `depth: 0` in `beforeOperation`.

### Tests (fail-before / pass-after)
- Temporarily removed `frame-src` and Media serializer → `tests/content-security-policy.spec.ts` and S4-2 media test **failed**.
- Restored fixes → both **passed**. Full suite: **79/79**.

### Local browser verification (`http://localhost:3000/projects/north-ridge`)
- CSP header includes `frame-src https://www.openstreetmap.org`.
- **0** CSP frame-violation console errors.
- OSM embed navigated; tile requests to `tile.openstreetmap.org` observed; map tiles + marker + OSM attribution **visibly rendered** (screenshot `/tmp/map-section.png`).
- Failure simulation (strip `frame-src` via response rewrite): CSP refusal logged; after timeout, iframe removed and **"Map unavailable. Use the location details above."** shown — not a blank box.
- `GET /api/media?limit=5`: no `tenant` key.
- Regressions: `/projects/hidden-lake` 404; `/projects/copper-ridge-isolation` 404; `?q=NORTHERN SECRET` empty; `/api/companies` → only `aurora-gold` without `websiteDomain`/`subdomain`/`templateKey`/`tenant`.

### L-3
Still **not done** — Supabase PITR/restore UI rehearsal remains an owner action outside this remediation.

### Live alias re-verify
After push/redeploy of this remediation commit, re-check map tiles + zero CSP violations in a real browser against https://mining-ir-platform.vercel.app/projects/north-ridge (not curl-only).

**Live evidence (2026-08-16, post-remediation):**
- Remediation commit: `6b62a89`
- Deployment: `dpl_6Ngb8vRJosSv189Yfdi7XyPa7TiL` / https://mining-ir-platform-94z8yh6q9-donkimc.vercel.app → aliased to https://mining-ir-platform.vercel.app
- CSP header includes `frame-src https://www.openstreetmap.org`
- Chromium against `/projects/north-ridge`: iframe present for ≥8s, OSM frame URL loaded, **0** CSP frame violations, Hide control present, text coordinates present; map section screenshot shows tiles + marker
- Anonymous `/api/media?limit=5`: no `tenant` key
- L-3 still not done

## S4-6 / S4-7 remediation + env preflight (post re-review)

**Date:** 2026-08-17  
**Review addendum:** `docs/SPRINT4_REVIEW.md` (S4-6 Medium map race; S4-7 untracked unlock script)

### Approach (S4-6)
Chose **client-side-only iframe mounting** plus an **already-loaded guard**:
- SSR no longer emits the iframe, so HTML parse cannot fire `load` before React attaches `onLoad` (root cause of the intermittent ~5s removal).
- `shouldArmMapLoadTimeout` / `isIframeAlreadyLoaded` skip arming only for a completed **non-`about:blank`** same-origin document. Initial `about:blank` is ignored so the failure watchdog still arms for hung/CSP-blocked embeds.
- `onLoad` also ignores `about:blank` so an early blank load does not clear the watchdog before the real embed finishes.
- Did **not** raise `MAP_LOAD_TIMEOUT_MS`.

### S4-7
**Committed** `scripts/unlock-staging-users.ts` with an ops header (when to use, staging-only guards). Not gitignored — the script has no hardcoded secrets and belongs in the repo for repeatable staging unlocks.

### Env preflight
- Added `scripts/check-env.mts` and `npm run check:env` (PRESENT/MISSING only; `DATABASE_URI` prints username/host/port + password length).
- Documented in `docs/DEPLOYMENT.md`.

### Local verification
- `npm run verify`: pass (lint, typecheck, **83/83** tests, migration-drift, `build:ci`).
- `npm run check:env` (local): all PRESENT; warnings for non-pooler local username and `PAYLOAD_DATABASE_PUSH=true` (expected for `.env.local`).
- Playwright Chromium `/projects/north-ridge` ×5 after ~8s:

| Load | iframe still present | Map unavailable | OSM src | CSP violations |
| --- | --- | --- | --- | --- |
| 1 | yes | no | yes | 0 |
| 2 | yes | no | yes | 0 |
| 3 | yes | no | yes | 0 |
| 4 | yes | no | yes | 0 |
| 5 | yes | no | yes | 0 |

- Failure path: hang OSM requests → after ~6.5s iframe removed, **"Map unavailable. Use the location details above."** with coordinates still shown; then successful load restored.
- Regressions: `/projects/hidden-lake` 404; `?q=NORTHERN SECRET` no poison result links; anonymous `/api/media` no `tenant`; `/api/companies` → only `aurora-gold`.

### L-3
Still **not done**.

### Live alias re-verify
After push/redeploy, repeat the 5× map check against https://mining-ir-platform.vercel.app/projects/north-ridge.