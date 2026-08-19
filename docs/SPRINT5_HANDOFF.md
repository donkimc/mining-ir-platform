# Sprint 5 Handoff — Automation

## Status

Implementation in progress (local). Application code, ADRs 0012–0015, provenance migrations, ingestion UI, fixture extraction adapter and tests are present. `npm run verify` passes locally. Sprint 5 is **not Done** until committed release-candidate evidence, deployed `check:env`, Production migrate (or explicit Product Director deferral) and independent review close Critical/High findings.

## Sprint Goal

Make document automation safe to introduce into the mining disclosure workflow by first completing the carried production and media safeguards, then enabling tenant-scoped document ingestion, immutable machine-origin/provenance metadata and stronger human review context. Sprint 5 deliberately stops short of sending unpublished technical reports to an external AI provider or publishing machine-generated content; a narrower, correct automation foundation is preferable to an extraction feature whose data-egress and disclosure controls are not yet approved.

## Non-Goals

- External LLM or third-party AI processing of unpublished tenant documents.
- Automatic publication of any content.
- Bulk ingestion, scheduled crawlers, email ingestion or SEDAR+ integration.
- Investor accounts, investor PII, market data, analytics or notifications.
- Billing, custom domains, new templates or provisioning automation.
- Technical interpretation, reserve estimation, grade validation or investment recommendations.
- Replacing Payload, Supabase Storage, the existing publication lifecycle or the Explorer template.

## Scope Decisions

| Candidate | Sprint 5 decision | Rationale |
| --- | --- | --- |
| Document ingestion | **IN, bounded** | Allow an authenticated Company Admin to upload a PDF/technical report into an existing tenant Document using the existing private Media path. This is the smallest useful automation foundation and exercises the most-reviewed storage component without adding an ingestion crawler. |
| AI-assisted extraction of fields or draft summaries | **OUT for external execution** | The current system cannot yet prove acceptable third-party egress, retention, training, residency or tenant consent. Define an adapter contract and test fixture only; do not send real tenant documents to an AI provider in Sprint 5. |
| Provenance and machine-origin marking | **IN** | This is required before any future machine-generated content can enter the disclosure pipeline. Origin is server-derived and immutable to Company Admins. |
| Human approval workflow improvements | **IN** | Reviewers need machine-origin badges, source-document/page links, diffs and explicit source verification before approval. This strengthens ADR-0004 rather than changing it. |
| Bulk or automated ingestion pipelines | **OUT** | Scheduling, retries, duplicate detection, queue ownership and untrusted input handling would expand the attack surface before the single-document path is proven. |
| Automatic publication | **OUT, permanently prohibited by this sprint** | ADR-0004 requires human review. No extraction, queue or service may bypass the existing status-only `Review → Published` transition. |

### Recommended boundary

Sprint 5 should ship **secure ingestion + provenance + reviewer context**, not live AI extraction. A future sprint may enable an extraction provider only after the egress ADR is accepted, tenant consent is represented, and a separate review proves that the provider boundary and generated-content controls work in a deployed environment.

## Carry-In Work and Ordered Breakdown

### 1. Production promotion and deployed-environment observation

**Priority:** First operational gate, before customer content.

**Rationale:** The real Production Supabase project `bwftfsfbiyzgwztwtqmh` has never been migrated or exercised. Sprint 5 must not build automation on an environment whose TLS and migration configuration are only assumed.

**Files/areas touched:**

- `docs/DEPLOYMENT.md`
- `docs/OPERATIONS.md`
- `docs/SPRINT5_HANDOFF.md`
- Vercel Preview and Production environment settings
- Supabase staging and Production project settings
- `npm run check:env` output/evidence

**Migration:** Yes, run `npm run migrate` against the real Production project. Never use Payload schema push.

**Risk:** Critical operational risk. A wrong Vercel environment variable can connect the public alias to the wrong database or leave TLS/push guards unverified.

**Acceptance criterion:** A recorded deployment observation from the intended Vercel environment shows the correct Supabase project, a project-specific `DATABASE_SSL_CA`, `PAYLOAD_DATABASE_PUSH=false` or absent, and no Preview-only variable dependency. The empty Production project is migrated with `npm run migrate`, followed by fictional smoke data only. `seed:reset` is never run against Production.

**Required evidence:** Run `npm run check:env` in the deployed environment or use an equivalent non-secret deployment probe. Do not infer environment values from local `.env` files or from a successful database connection.

### 2. Close Sprint 4 carry-ins S4-3, S4-4 and S4-5

**Timing:** Week 1.

**Rationale:** These are already diagnosed and must not be repeatedly rediscovered during automation work.

#### S4-3 — Remove the anonymous media cap

**Files/areas:** `src/collections/Media.ts`, media access helpers, `tests/media-access.int.spec.ts`, storage/privacy tests.

**Migration:** No, unless a supporting index is added; then generate and commit the migration with the schema change.

**Risk:** High for media availability and potentially authorization if the replacement query broadens scope.

**Acceptance criterion:** A non-production fixture with more than 1,000 eligible media references proves that an authorized Published file beyond the former cap is readable, while Draft, Review, Archived, wrong-tenant and unreferenced files remain denied. The test runs against the actual media authorization path, not only a helper.

#### S4-4 — Complete CSP and visitor-privacy documentation

**Files/areas:** `docs/decisions/ADR-0010-project-map-provider-and-data-policy.md`, `docs/SECURITY.md`, `docs/DESIGN.md`.

**Migration:** No.

**Risk:** Medium. Third-party OSM embeds can fail under CSP and disclose visitor IP/request data to a third party.

**Acceptance criterion:** ADR-0010 records `frame-src`, browser failure/fallback behavior and the visitor-data implication of the OSM request. A browser check proves the deployed map either renders or shows the documented fallback; documentation does not claim “no visitor PII” while the embed loads without qualification.

#### S4-5 — Remove stale literal seed passwords from documentation

**Files/areas:** `README.md`, `docs/SPRINT1_HANDOFF.md`, local-login documentation.

**Migration:** No.

**Risk:** Medium security/documentation risk. Repeating literal credentials recreates the review-packet exposure pattern.

**Acceptance criterion:** Documentation points to the configured local `.env` variables and a fresh local seed/login check succeeds using those variables; no literal password appears in tracked Markdown.

### 3. Settle the AI-disclosure and provenance ADR before schema work

**Timing:** Week 1, before implementing machine-origin fields.

**Rationale:** `reviewedBy` and `reviewedAt` identify the reviewer but do not identify whether the content was machine-generated. That distinction is required by ADR-0004 and cannot be retrofitted after extraction is live.

**Files/areas:**

- New `docs/decisions/ADR-0012-ai-assisted-content-disclosure-and-provenance.md`
- `docs/PRODUCT.md`, `docs/DATA_MODEL.md`, `docs/SECURITY.md`
- `docs/TESTING.md`

**Migration:** No for the ADR itself. Yes if the concrete provenance fields are added to Payload collections.

**Risk:** Critical for disclosure integrity. An origin flag that can be edited by a Company Admin or omitted from approval is not a control.

**Acceptance criterion:** ADR-0012 explicitly states who may set each origin/provenance field, that machine-origin state is server-derived and immutable to Company Admins, how reviewers see it before approval, how source locations are represented, what audit fields are retained, and that all generated content still requires status-only human approval.

### 4. Settle data-egress and provider policy before any extraction call

**Timing:** Week 1; no provider integration until accepted.

**Rationale:** Sending an unpublished NI 43-101 or drill result to a third-party AI provider crosses the tenant boundary. Provider selection is secondary to whether egress is acceptable at all.

**Files/areas:**

- New `docs/decisions/ADR-0013-ai-data-egress-and-provider-policy.md`
- `docs/SECURITY.md`, `docs/OPERATIONS.md`, `docs/DEPLOYMENT.md`
- Future adapter boundary only; no provider secret is added in Sprint 5

**Migration:** No unless consent/provider configuration is persisted. Do not add a tenant consent field without the ADR's approved data model.

**Risk:** Critical confidentiality and contractual risk. A logging or retry layer must not copy document bytes into logs.

**Acceptance criterion:** ADR-0013 records whether Sprint 5 permits external egress. Under the recommended decision, no external AI request is made. Tests prove the default configuration has no provider call, no provider secret and no document content in logs. If the Product Director approves egress, the ADR must record retention, training opt-out, data residency, subprocessors, encryption, tenant consent, deletion, outage and cost controls before implementation continues.

### 5. Implement bounded tenant-scoped document ingestion

**Timing:** Week 2.

**Rationale:** Ingestion is a new write path into Media. It must reuse the private bucket, UUID object keys, tenant ownership and Published-reference rule rather than creating a second upload path.

**Files/areas:**

- `src/collections/Media.ts`
- `src/collections/Documents.ts`
- existing dashboard document form/actions under `src/app/(frontend)/dashboard/documents/`
- `src/lib/dashboard-crud.ts`
- `src/lib/publishing.ts`
- `src/lib/collection-hooks.ts`
- `src/lib/tenant.ts` and access helpers as needed
- `tests/media-access.int.spec.ts`, `tests/sprint2-content.int.spec.ts`, `tests/tenant-isolation.int.spec.ts`

**Migration:** Only if new fields or indexes are required; generated migration must be in the same commit.

**Risk:** High. A new write path can assign the wrong tenant, make a file public, bypass file validation, create a Published document directly or expose a draft through a guessed object URL.

**Acceptance criterion:** On deployed Preview, an authenticated Aurora Company Admin can upload a valid fictional PDF into an existing Aurora Document as Draft; the stored object uses a UUID-prefixed key, the Supabase bucket remains private, the file is not anonymously downloadable, the file remains inaccessible through the public media route until its Document is Published, and a Northern Company Admin cannot attach or read it. Invalid file type/size is rejected without an orphaned public object.

### 6. Implement immutable machine-origin and provenance model

**Timing:** Week 2–3, after ADR-0012.

**Rationale:** Future extraction must leave an inspectable trail from generated content to its source. Provenance must be visible before approval and must not be editable away.

**Files/areas:**

- New or amended collection fields in `src/collections/Documents.ts`, `NewsReleases.ts`, `Projects.ts`, `ExplorationContents.ts`, `ShareStructures.ts` and other disclosure-bearing collections as applicable
- Shared types/helpers under `src/lib/`
- `docs/DATA_MODEL.md`, `docs/SECURITY.md`, `docs/ARCHITECTURE.md`
- `tests/publishing.spec.ts`, `tests/tenant-isolation.int.spec.ts`, new provenance tests

**Migration:** Yes. Generate a Payload migration in the same commit as the fields and run migration-drift CI.

**Proposed fields:**

- `contentOrigin`: server-controlled enum `human_authored` or `machine_assisted`; default `human_authored` for existing records; never accepted as a trusted Company Admin input.
- `originLockedAt`: server timestamp set when the record first receives machine-assisted content or when the record enters Review; Company Admin cannot clear or downgrade it.
- `sourceDocument`: tenant-scoped relation to the source Document/Media record.
- `sourceLocation`: structured page number, section/anchor and optional character/region reference; no public exposure of raw source text by default.
- `provenanceClaims`: internal claim references containing claim identifier, source document, page/location and extraction-run reference; reviewer-facing, never anonymous.
- `extractionRunId`, `extractionProvider`, `extractionModel`, `extractionModelVersion`, `extractedAt`: server-generated audit values when extraction is eventually enabled; nullable for human-authored records.
- `reviewerSourceCheckAt` and `reviewerSourceCheckBy`: server-derived acknowledgement that the reviewer inspected the source context; separate from publication metadata and required for machine-assisted approval if approved by ADR-0012.

Do not store raw confidential source excerpts in public fields or logs. If excerpts are needed for reviewer UX, store them in a protected internal field or derive them on demand from the tenant-owned source document.

**Immutability rules:** Company Admins may edit Draft content, but cannot set `contentOrigin`, alter extraction audit values, change the source tenant, remove provenance from a machine-assisted record or convert `machine_assisted` to `human_authored`. Platform Admins may not rewrite origin history through ordinary content mutations. Only a controlled server-side operation may create a provenance record, and audit corrections must be append-only.

**Risk:** Critical. A mutable origin field would let machine-generated content appear human-authored before approval.

**Acceptance criterion:** A test attempts to forge, clear or downgrade every origin/provenance/audit field and proves the server preserves the original values. A machine-assisted fixture remains visibly marked in the authenticated reviewer view and cannot transition to Published unless the existing status-only approval action also confirms the required source review. Anonymous output contains none of the provenance or reviewer fields.

### 7. Improve human review context without changing approval semantics

**Timing:** Week 3.

**Rationale:** Reviewers approve plausible-looking errors. The UI should make source checking and changed content unavoidable without pretending that a UI can guarantee technical correctness.

**Files/areas:**

- Dashboard review pages/forms under `src/app/(frontend)/dashboard/`
- `src/lib/publishing.ts`
- shared review/provenance components under `src/components/`
- `docs/DESIGN.md`, `docs/SECURITY.md`
- reviewer and publishing tests

**In:** Machine-origin badge before approval, side-by-side current draft/previous version diff, source-document link, page/location links, units/grade/hole-ID fields displayed as structured values where already modeled, explicit source-check acknowledgement and clear rejection/request-changes state.

**Out:** Automated technical validation, reserve/grade interpretation, AI confidence treated as approval, automatic correction or automatic publication.

**Migration:** No additional migration if it uses the fields from item 6; otherwise yes with the same-commit rule.

**Risk:** High. Approval must remain a separate status-only operation. Review UI must not send content edits and `status=published` in one request.

**Acceptance criterion:** In a deployed authenticated reviewer flow, machine-assisted content shows origin, source document and source page/location before approval. A request that changes content and publishes together is rejected; a source-reviewed, status-only approval records server-derived reviewer metadata and makes the content public only after approval. A rejected/revised item remains non-public.

### 8. Add provider-neutral extraction boundary and negative fixture, without live AI egress

**Timing:** Week 4, only after ADRs 0012 and 0013.

**Rationale:** The codebase can prepare for a provider later without making external AI calls in this sprint. A deterministic fixture tests the publication boundary and provenance shape.

**Files/areas:**

- New provider-neutral adapter interface under `src/lib/` or an equivalent existing boundary
- Test fixture only; no provider SDK or production secret
- `tests/publishing.spec.ts`, new provenance/extraction-boundary tests
- `docs/ARCHITECTURE.md`, `docs/SECURITY.md`

**Migration:** No additional migration beyond item 6.

**Risk:** Medium if the adapter accidentally becomes a hidden network path or accepts untrusted origin metadata.

**Acceptance criterion:** The default test adapter consumes a fictional fixture, returns a Draft proposal with `machine_assisted` provenance and source locations, and cannot call a network provider. The proposal cannot become Published through create/update or a combined content-plus-status request; only the existing status-only human approval path can publish it after reviewer source acknowledgement.

## Provenance and Machine-Origin Model

The model is intentionally server-controlled:

| Field | Meaning | Who can set it | Mutable by Company Admin? | Public? |
| --- | --- | --- | --- | --- |
| `contentOrigin` | Human-authored or machine-assisted | Server ingestion/extraction operation | No | No |
| `originLockedAt` | Time origin became machine-assisted/locked | Server | No | No |
| `sourceDocument` | Tenant-owned source record | Server-validated mutation | No cross-tenant change; removal blocked for machine content | No, except intentional published source link |
| `sourceLocation` | Page/section/region locator | Server extraction or reviewer-safe correction | No for audit history; append-only correction | No |
| `provenanceClaims` | Claim-to-source references | Server extraction/reviewer workflow | No deletion by ordinary editor | No |
| `extractionRunId` | Extraction execution identity | Server | No | No |
| `extractionProvider` | Provider or local adapter | Server | No | No |
| `extractionModel` / `extractionModelVersion` | Model identity | Server | No | No |
| `extractedAt` | Extraction timestamp | Server | No | No |
| `reviewerSourceCheckBy` / `reviewerSourceCheckAt` | Reviewer inspected source context | Server approval action | No | No |
| `reviewedBy` / `reviewedAt` / `publishedAt` | Existing publication audit metadata | Server status-only approval | No | No |

For plausible extraction errors such as a transposed grade, wrong hole ID or unit error, Sprint 5 reduces risk through source-page links, visible machine-origin marking, structured before/after diffs, explicit source acknowledgement and rejection/request-changes flow. It does not claim that these controls prove technical correctness. A future extraction sprint must add domain-specific validation or preserve the human reviewer as the final control without treating model confidence as evidence.

## New ADRs Required

| ADR | Decision it must record | Required timing |
| --- | --- | --- |
| ADR-0012 — AI-assisted content disclosure and provenance | Machine-origin enum, immutable audit fields, source/page provenance, reviewer acknowledgement, public serialization and the rule that machine-assisted records require the existing status-only approval. | Before schema or extraction work |
| ADR-0013 — AI data egress and provider policy | Whether unpublished documents may leave the tenant boundary; provider/hosting choice, retention, training opt-out, data residency, subprocessors, consent, deletion, encryption, logs, cost, outage and legal/contract assumptions. Recommended Sprint 5 decision: no external egress. | Before any provider call or provider secret |
| ADR-0014 — Bounded document ingestion and automation boundary | One-document manual ingestion, file limits, duplicate/orphan handling, queue boundary if any, retries, idempotency and why bulk automation is deferred. | Before ingestion implementation |
| ADR-0015 — Reviewer source-verification contract | Required UI evidence, source-page/location behavior, diff semantics, reviewer acknowledgement and limits of automated technical validation. | Before review UX implementation |

If the Product Director chooses external AI egress, amend ADR-0013 before implementation and add a separate security/privacy review. Do not resolve that choice in Cursor.

## Test Plan

### Production and carry-in evidence

- `npm run check:env` is run against the intended deployed environment without exposing secret values.
- The real Production project is migrated with `npm run migrate`, never push.
- Production has the project-specific `DATABASE_SSL_CA` and `PAYLOAD_DATABASE_PUSH=false` or absent.
- Vercel Preview and Production variables are checked separately; a Preview-only value is not treated as present in Production.
- Fictional smoke data is loaded before any customer content.
- Staging restore rehearsal evidence remains recorded and the Production migration smoke test is separate from it.

### Media and ingestion

- Real fictional PDF upload through the dashboard creates a tenant-owned private object.
- Wrong-tenant attach, read, update and delete attempts fail.
- Direct Supabase object URLs return no bytes for Draft/Review/unreferenced media.
- Published referenced media works through the application route only.
- More than 1,000 eligible media references do not silently deny a valid Published file.
- Invalid file type/size, duplicate upload and failed persistence do not leave an anonymously readable orphan.

### Provenance and disclosure

- Forged machine-origin, source, extraction model, timestamp and reviewer fields are ignored or rejected.
- Machine-assisted records visibly show origin and source location to reviewers before approval.
- Machine-assisted records cannot be created directly as Published.
- Combined content-edit + publish requests are rejected.
- Status-only approval is the only route to Published and records server-derived reviewer metadata.
- Anonymous HTML, metadata, API responses and media responses omit provenance, extraction, reviewer and internal tenant fields.
- A Northern Copper machine-assisted/source fixture never appears on Aurora routes or APIs.

### Extraction-error scenario

Use a deterministic fictional technical report containing:

- A grade written as `1.20 g/t Au` where a faulty fixture proposes `12.0 g/t Au`.
- A hole identifier `AG-24-017` where a faulty fixture proposes `AG-24-071`.
- A units change from `g/t` to `%`.

The reviewer view must show the proposed value, prior value, machine-origin marker and source page/location. The fixture must prove that the reviewer can reject/request changes and that the incorrect proposal never appears publicly. Do not claim that passing this fixture proves real-world extraction accuracy.

### Network-egress tests

- Default Sprint 5 configuration makes zero external AI requests.
- No document bytes or raw source excerpts appear in logs, errors, telemetry or test output.
- A missing/disabled provider configuration produces a clear Draft-only result, not an automatic fallback to publication.
- If external egress is later approved, contract tests prove provider timeout, retry, deletion, tenant consent and failure behavior before live rollout.

## Production Promotion Plan

1. Keep the reviewed Vercel alias backed by staging until Sprint 5 code, carry-ins and independent review are complete.
2. Repair and verify the Vercel Preview environment before using it as evidence; the Sprint 4 review found a broken Preview `DATABASE_URI`.
3. Run `npm run check:env` against Preview and Production separately. Do not infer `DATABASE_SSL_CA` or `PAYLOAD_DATABASE_PUSH` from local files or successful database boot.
4. Confirm the real Production Supabase project is `bwftfsfbiyzgwztwtqmh` and remains empty before migration.
5. Configure the Production Vercel variables explicitly: project-specific `DATABASE_URI`, project-specific `DATABASE_SSL_CA`, `PAYLOAD_DATABASE_PUSH=false` or absent, Production `PAYLOAD_SECRET`, private storage credentials and no unapproved AI provider credentials.
6. Run `npm run migrate` against the real project. Never run Payload schema push and never run `seed:reset` against Production.
7. Confirm the staging restore rehearsal evidence is complete and repeat the required Production smoke/recovery checks before customer content. The restore process must not be inferred from documentation alone.
8. Load fictional Aurora Gold smoke data first. Verify Company Admin upload, private Draft media, Published media route, review/provenance UI, public serializer, tenant isolation and no external AI egress.
9. Deploy the exact committed release candidate and record URL, deployment ID, commit, environment, Supabase project and all evidence.
10. Product Director decides whether to promote customer content. No automatic or machine-generated content may be Published without the approved human review workflow.

## Exit Criteria

- Production project `bwftfsfbiyzgwztwtqmh` is migrated with `npm run migrate`, never push, or the Product Director records an explicit non-promotion decision.
- `DATABASE_SSL_CA` and `PAYLOAD_DATABASE_PUSH` are observed from the intended deployed environments, not assumed.
- S4-3 is fixed or explicitly deferred with evidence and risk acceptance.
- S4-4 and S4-5 are closed with browser/documentation checks.
- A Company Admin can ingest one valid fictional PDF into the correct tenant's existing Document through the private Media path.
- Media authorization remains correct for Draft, Review, Published, wrong-tenant, unreferenced and over-1,000-reference fixtures.
- Provenance and machine-origin fields are server-controlled, immutable to ordinary editors, tenant-scoped, non-public and migration-backed.
- Reviewers see machine-origin, source page/location and diff context before approval.
- No external AI provider receives tenant documents in Sprint 5 unless ADR-0013 is accepted and the separate egress review passes.
- The deterministic extraction fixture cannot bypass status-only human approval and the plausible-error scenario remains non-public when rejected.
- No automatic publication, investor PII, market data, bulk ingestion or SEDAR+ integration is present.
- `npm run verify`, migration-drift and relevant incremental migration checks pass on the exact committed release candidate.
- Preview and Production evidence is collected at the layer that must work: browser for UI, storage endpoint for media privacy, deployed environment for variables and database for migration.
- Independent review follows ADR-0008's Evidence Standard and leaves no Critical/High disclosure, tenant-isolation, media or data-egress finding open.

## Open Questions for the Product Director

1. Approve the recommended narrower Sprint 5: ingestion, provenance and review improvements, with live external AI extraction deferred?
2. Is any external processing of unpublished NI 43-101 or drill-result documents acceptable, and under what contractual/privacy terms?
3. Should machine-assisted provenance fields be added now to all disclosure-bearing collections, or only to the first future extraction target while preserving a shared schema?
4. Which roles may perform the enhanced source-verification acknowledgement: Company Admin, Platform Admin, or a new reviewer role?
5. Is the real Production project migration part of Sprint 5 completion, or should it remain a separate go-live milestone after this sprint?

## Independent Review Handoff

Give the independent reviewer the exact committed Preview URL, the repaired Preview environment evidence, commit SHA, changed files, migration files, `npm run verify` results, `npm run check:env` results, media probe results, storage privacy results, provenance fixture results, extraction-error fixture results, external-egress evidence, Production project reference and restore evidence.

Use this request:

> Review the Mining IR Platform Sprint 5 release candidate against `AGENTS.md`, `docs/SPRINT5_HANDOFF.md`, `docs/SPRINT4_REVIEW.md`, `docs/SPRINT4_HANDOFF.md`, `docs/SPRINT3_REVIEW.md`, `docs/SECURITY.md`, `docs/TESTING.md`, `docs/OPERATIONS.md`, `docs/DEPLOYMENT.md`, ADR-0004, ADR-0007, ADR-0008, ADR-0012 and ADR-0013. Follow ADR-0008's Evidence Standard: verify claims with reproducible commands, deployment observations, infrastructure settings or test fixtures. Prioritize production environment observation, media authorization beyond the former cap, tenant-scoped ingestion, private bucket behavior, immutable machine-origin/provenance, reviewer source context, plausible extraction errors, status-only approval, anonymous serialization, Northern Copper negative fixtures and external data egress. Test in a browser where UI behavior is claimed and at the storage/provider boundary where privacy is claimed. Classify findings as Critical, High, Medium or Low with reproduction steps, affected files/routes and recommended fixes. Do not recommend customer-content promotion while a Critical or High issue remains open.

## Completion Report

Cursor or the implementing engineer must append evidence here before Sprint 5 is marked complete:

- Product Director scope and data-egress decision: **Assumed recommended narrower Sprint 5** (ingestion + provenance + review; no external AI egress per ADR-0013). Explicit Product Director sign-off still required.
- Commit SHA: `95e6666` (pushed to `origin/main`).
- Changed files: ADRs 0012–0015; provenance fields/hooks/migrations; Media pagination (S4-3); document PDF attach; MachineOriginReviewPanel; fixture extraction adapter; S4-5 docs/env cleanup; ADR-0010/SECURITY updates; unit + integration tests.
- Migration files and drift result: `20260818_sprint5_provenance.ts`, `20260819_sprint5_content_origin_enums.ts` (+ `.json` snapshot). `npm run check:migration-drift` **pass**.
- `npm run verify` result: **pass** locally (2026-08-19) — lint, typecheck, 97 tests, migration-drift, `build:ci`.
- `npm run check:env` results by deployed environment: **Not verified** in this session (requires deployed Preview/Production observation).
- Production project migration result: **Not run** against `bwftfsfbiyzgwztwtqmh`.
- Staging schema migration (Vercel Production alias DB `jthotkkremiesvocfsmr`): **Applied 2026-08-19** — `20260818_sprint5_provenance` and `20260819_sprint5_content_origin_enums` with `PAYLOAD_DATABASE_PUSH=false`. Required after deploy of `95e6666` failed prerender with `column companies.content_origin does not exist`.
- S4-3/S4-4/S4-5 results: S4-3 pagination + >1000 mock coverage in `tests/sprint5-provenance.int.spec.ts`; S4-4 ADR-0010/SECURITY updated; S4-5 literal seed passwords removed from tracked docs / `.env.example` emptied for passwords.
- Ingestion and private-media evidence: Dashboard `attachDocumentPdfAction` + `src/lib/ingestion.ts` (PDF, 10 MiB). Deployed Preview upload + direct-object denial **Not verified** this session.
- Provenance/machine-origin evidence: Server strip/restore, no downgrade, anon strip; int test forge + ack gate **pass**.
- Reviewer source-context evidence: `MachineOriginReviewPanel` + source-check checkbox on disclosure content types including company/projects/news/documents/exploration/management/share-structure. Browser UI **Not verified** this session.
- Plausible extraction-error evidence: Fixture adapter returns wrong grade/hole/units; int test reject→draft path **pass**.
- External-egress/no-provider-call evidence: Fixture-only adapter (no network). Live provider secrets not added.
- Restore/recovery evidence: **Deferred** to staging/Production ops (not re-run this session).
- Preview URL and deployment ID: Redeploy of `95e6666` (or follow-up evidence commit) pending after staging migrate.
- Independent review result: **Pending** after successful deployed build + manual smoke.
- Deferred work and accepted risks:
  - Deployed Preview repair + `check:env` evidence
  - Production migrate (or Product Director non-promotion decision)
  - Cloud staging PDF upload / direct-object denial probe
  - Northern Copper machine-assisted negative fixture on public routes (extend if review requires)
  - Do not mark Sprint 5 Done until exit criteria and review gates pass
