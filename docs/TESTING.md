# Testing

## Automated Checks

The repository must provide documented commands for linting, type checking, tests and production build. Run them before review and record the results in the Sprint 1 Notion page.

```bash
npm run lint
npm run typecheck
npm test
npm run build
# or: npm run verify
```

`npm test` includes a static guard that every `'use server'` module only exports async functions (plus erased `export type`s). Lint/typecheck/tests alone do not catch production Server Action export failures — always run `npm run build` as well.

## Minimum Test Matrix

| Scenario | Expected result |
| --- | --- |
| Public visitor opens Home | Published Aurora Gold data only |
| Public visitor opens Projects | Published projects for the resolved tenant only |
| Public visitor opens draft project | Not found or excluded |
| Unauthenticated user opens dashboard | Redirect to login or equivalent |
| Company Admin reads own tenant | Allowed |
| Company Admin reads another tenant | Rejected without data leak |
| Company Admin writes another tenant | Rejected |
| Company Admin writes another tenant's project | Rejected without data leak |
| Platform Admin lists tenants | Allowed |
| Draft to Published without review | Rejected for disclosure-sensitive content |
| Approved content becomes Published | Allowed and visible publicly |
| Invalid profile/project form | Validation errors; no partial mutation |
| Invalid profile/project form fields | Validation errors; no partial mutation |
| Published disclosure field edit | Rejected; public read unchanged |

## Manual Smoke Test

1. Start the app with seeded Aurora Gold data.
2. Open Home, Projects and a Project Detail page on desktop and mobile widths.
3. Log in as Company Admin and edit a profile field.
4. Confirm the edit remains private until the defined publish action.
5. Publish approved content and confirm the public page changes.
6. Attempt a wrong-tenant URL or mutation.
7. Check loading, empty, error, unauthorized and not-found states.

## Review Handoff

The Sprint 1 implementation handoff for Claude (or human) review lives in:

**[SPRINT1_HANDOFF.md](./SPRINT1_HANDOFF.md)**

It records what shipped, local login credentials, commands run and results, ADR/decision pointers, known limitations, and review focus. Claude should review tenant isolation, publication rules, disclosure approval, docs and responsive behavior. Findings are ordered by severity with file and line references.

## Sprint 2 Minimum Test Matrix

| Scenario | Expected result |
| --- | --- |
| Company Admin creates News for own tenant | Allowed as Draft |
| Company Admin creates News for another tenant | Rejected |
| Company Admin reads another tenant's Document | Not found or rejected without leakage |
| Related Project belongs to another tenant | Validation rejects the relationship |
| Public News list | Published records for the resolved tenant only |
| Draft/Review News detail | Not found publicly |
| Published News edit to material field | Rejected or returned to Review; old Published version remains public |
| Approval request changes content and status together | Rejected |
| Status-only approval of reviewed content | Allowed for authorized reviewer |
| Forged reviewer input | Ignored or rejected; server derives values |
| Document without source reference | Material content cannot publish |
| Share Structure with source and as-of date | Validates and renders when Published |
| Management profile wrong tenant | Rejected |
| Exploration content wrong project tenant | Rejected |
| Public response includes reviewer/internal fields | Must not include them |

## Sprint 2 Manual Smoke Test

1. Seed fictional Aurora Gold content, including at least one Draft News Release and one Draft Share Structure.
2. Create and save a News Release, Document, Person, Share Structure and Exploration record as Company Admin.
3. Confirm each remains private while Draft or Review.
4. Approve content through the separate review action and confirm it appears publicly.
5. Edit a material field on a Published record and confirm the review gate protects the public version.
6. Attempt wrong-tenant records and cross-tenant relationships.
7. Check empty, validation, loading, unauthorized and not-found states at desktop and mobile widths.

## Cloud Staging Verification

Before Claude's final Sprint 2 review, test the deployed Vercel Preview URL rather than only localhost:

1. Confirm the Preview build points to the Supabase Pro staging database.
2. Confirm no Preview variable contains `localhost`, local credentials or the production database URL.
3. Open all Sprint 1 and Sprint 2 public routes.
4. Log in as Company Admin and Platform Admin using staging-only accounts.
5. Create Draft content, verify it is private, submit it for review, approve it, and verify the Published public result.
6. Attempt wrong-tenant reads, writes and related-record assignments.
7. Verify media/document links survive a fresh deployment.
8. Record the Preview URL, deployment commit, database project, migration result, seed result and any known limitations in `docs/SPRINT2_HANDOFF.md`.

Cloud staging is a required Sprint 2 gate. A local green test suite is not sufficient by itself.

## Sprint 3 Release-Hardening Matrix

| Scenario | Expected result |
| --- | --- |
| Direct Supabase object URL for Draft/Review media | Denied; no bytes returned |
| Authorized application media route for Published media | Allowed for the intended tenant only |
| Wrong-tenant or unauthenticated application media route | Denied without metadata leakage |
| Old session after secret rotation | Invalid; user must authenticate again |
| Preview/Production without verified TLS CA | Deployment or startup fails closed |
| Production with schema auto-push enabled | Deployment or startup fails closed |
| Migration against prior Sprint 2 schema | Applies cleanly and is recorded |
| Failed migration or release rollback rehearsal | Recovery steps work against non-production data |
| Real cloud upload followed by redeploy | File persists and authorization remains correct |
| Anonymous API request across tenant slugs | Only the resolved tenant's intentional Published fields |
| Public response for all tenant-owned collections | No reviewer IDs, tenant-management fields or draft metadata |
| Exact remediation commit | CI runs lint, typecheck, tests, migration-drift check and production build |

The matrix must cover Company, Project, News, Document, Person, Share Structure, Exploration, Investment Highlight and Catalyst where those collections exist in the implementation.

## Sprint 3 release-hardening notes

- Private bucket probe: `npm run check:storage-privacy` (requires a real object key or public URL).
- Incremental upgrade rehearsal: `INCREMENTAL_MIGRATION_DATABASE_URI=postgres://…/disposable npm run test:incremental-migration`.
- Public API serializer coverage: `tests/sprint3-public-api.int.spec.ts` (all tenant-owned collections).
- Production TLS/push guards: `tests/database-guards.spec.ts` (no insecure production hatch).
- Operations: [OPERATIONS.md](./OPERATIONS.md) for rotation, restore, rollback and storage recovery.

## Sprint 3 Evidence Requirements

Record the command, commit SHA, environment class, deployment URL, Supabase project, migration result, direct-object result, cloud upload result, secret-rotation result and restore-rehearsal result in `docs/SPRINT3_HANDOFF.md`. Screenshots or logs may redact secret values but must retain enough context to reproduce the claim.

## Sprint 4 public discovery and maps

| Scenario | Expected result |
| --- | --- |
| Anonymous `/api/companies` | Only resolved tenant; no `websiteDomain` / `subdomain` / `templateKey` |
| Anonymous serializers | No `tenant`, reviewer fields or Northern poison strings |
| Projects/News/Documents filters | Published Aurora matches only; Draft/Review/Archived/Northern absent |
| Related project content | Same-tenant Published news/documents only |
| Valid Published coordinates | Illustrative OSM embed + text fallback; no API key in HTML |
| Invalid/missing/wrong-tenant coordinates | Text fallback only; no unauthorized marker |
| Map hide/failure control | Text location remains usable |

Coverage lives primarily in `tests/sprint3-public-api.int.spec.ts` plus existing disclosure/isolation suites.

