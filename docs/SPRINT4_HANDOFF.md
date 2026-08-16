# Sprint 4 Handoff — Investor Features

## Status

Planning only. This document does not authorize application-code changes. Cursor must not implement Sprint 4 until the Product Director confirms the open questions in this document and the scope is copied into an implementation task.

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

## Completion Report Template

Cursor or the implementing engineer must append evidence here before Sprint 4 is marked complete:

- Product Director scope decision:
- Map provider/ADR decision, or documented deferral:
- Commit SHA:
- Changed files:
- Migration files and drift result:
- `npm run verify` result:
- M-1/L-1/L-2/L-3/N3/N4 results:
- Preview URL and Vercel environment:
- Production Supabase project reference:
- `DATABASE_SSL_CA` verification:
- `PAYLOAD_DATABASE_PUSH` verification:
- Restore rehearsal evidence:
- Northern Copper negative-case evidence:
- Map and discovery evidence:
- Independent review result:
- Deferred work and accepted risks:
