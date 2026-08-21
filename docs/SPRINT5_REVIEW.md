# Sprint 5 Review — Automation (Ingestion, Provenance, Reviewer Context)

> Historical terminology note: this document predates the Sprint 6 fixture identity rename. Quoted Aurora Gold/Northern Copper names, poison strings and slugs refer to retired fictional test fixtures and are preserved as historical evidence; they are not current tenants or Production identities.

**Reviewer:** Claude (Opus 5), independent defect-first review
**Reviewed:** 2026-08-19
**Release candidate:** evidence/handoff `050fe52`; implementation tip `ff90259`; earlier markers `95e6666`, `0ebd168`
**Targets:** `https://mining-ir-platform.vercel.app` (Vercel Production alias → Supabase staging `jthotkkremiesvocfsmr`) and a local release-candidate build
**Evidence standard:** ADR-0008

---

## 1. Verdict: **Ship with conditions**

**No Critical findings. No High findings.** Every priority area in the review request holds under direct
probing: provenance is genuinely server-controlled and immutable, the private-bucket boundary is intact,
the machine-assisted approval gate cannot be bypassed through the API, anonymous serialization leaks no
provenance, tenant isolation holds on the new ingestion path, and there is no external AI egress.

This is the first sprint in the project's history where the headline feature worked as claimed on first
inspection.

**Conditions before customer content / real Production go-live** (none are code defects):

1. `S5-1` — the uncommitted `importMap.js` regression must be reverted (see findings).
2. Fictional smoke seed on `bwftfsfbiyzgwztwtqmh` has not been run; the Production DB has schema only.
3. Vercel alias cutover remains an explicit Product Director decision, correctly deferred.

## 2. Verified vs claimed-but-unverified

### Verified live — staging alias, anonymous
Provenance/extraction/reviewer fields absent from all 10 collections; Northern poison values absent from
API (0 hits) and HTML (0 hits); four draft/cross-tenant slugs 404; private-bucket boundary; published-
attached media 200 with bytes, draft-attached 403; no signed-URL redirect from the app route; no
`supabase.co` reference in any anonymous response; `/dashboard/documents/[id]/file` 307s to login when
unauthenticated.

### Verified live — local release-candidate build
`npm run verify` pass: lint, typecheck, **100 tests across 15 files**, migration-drift, `build:ci`.
Provenance forgery on create and update; downgrade and audit-clear attempts; machine-assisted approval
gate; status-only approval semantics on human records; anonymous serialization of a machine-assisted
record; cross-tenant document read/write/create/file-route; reviewer panel rendering; guard matrix.

### Claimed but not verified — carried forward honestly

| Claim | Status |
| --- | --- |
| Readable `vercel env pull` of Sensitive vars | **Not verified.** Vercel redacts as `[SENSITIVE]`. See S5-2 for a stronger substitute. |
| Full PEM observation of `DATABASE_SSL_CA` | **Not verified.** Presence is inferable (S5-2); contents are not. |
| Fictional smoke seed on real Production | **Not run.** Handoff states this; confirmed still true. |
| Vercel cutover to `bwftfsfbiyzgwztwtqmh` | **Not done**, by design. |
| Preview `DATABASE_URI` repair | **Not verified** this review. |
| Authenticated *staging* flows | **Not verified.** Staging credentials were correctly not shared. Equivalent checks run locally. |
| Browser click-through of the full approval | **Partially verified.** Panel rendering and gate behaviour verified; the final acknowledged approval is covered by unit + integration tests rather than a click. |

## 3. Findings

| ID | Severity | Area | Evidence | Reproduction | Expected | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- |
| **S5-1** | 🟡 Medium | regression / cms | The working tree carries an uncommitted change to `src/app/(payload)/cms/importMap.js` that **deletes** `S3ClientUploadHandler` — the exact line commit `9617c16` added to fix the blank Payload CMS. `grep -c S3ClientUploadHandler` → **0**. The committed file carries a warning comment that local `generate:importmap` strips it when `S3_*` are unset. | `git status --porcelain` → `M src/app/(payload)/cms/importMap.js`; `git diff` shows the handler import and map entry removed. | The committed importMap retains the S3 upload handler. | `git checkout -- "src/app/(payload)/cms/importMap.js"`. Deployed CMS is currently fine — this is one `git add .` from reintroducing the blank-CMS regression, and it has now survived two review cycles. Consider a CI guard asserting the handler is present. |
| **S5-2** | 🟢 Low | staging / evidence | The handoff records deployed `DATABASE_SSL_CA` and `PAYLOAD_DATABASE_PUSH` as Not verified because `vercel env pull` redacts Sensitive values. This understates available evidence: the Sprint 3 guards are fail-closed on Vercel, so a booting deployment is itself an observation. Verified guard matrix at HEAD: `VERCEL_ENV=production` + no CA → **THROWS**; + `REJECT_UNAUTHORIZED=false` → **THROWS**; + `push=true` → **THROWS**. | Run the guard matrix (`src/lib/database-guards.ts`), then observe the alias serving DB-backed routes (`/api/projects` → 200). | Evidence recorded at the strongest available level. | Record in the handoff: *because the guards fail closed on Vercel, a serving deployment proves `DATABASE_SSL_CA` is present and `PAYLOAD_DATABASE_PUSH` is not `true`.* This does **not** prove the PEM contents or distinguish `false` from absent — state that limit explicitly rather than leaving the whole item Not verified. |
| **S5-3** | 🟢 Low | provenance / API contract | Forged or downgrade writes to provenance fields return **HTTP 200** with no error; the server silently restores the original values. Verified: `PATCH {"contentOrigin":"human_authored"}` on a machine-assisted record → 200, DB still `machine_assisted`; `PATCH {"extractionProvider":null,"originLockedAt":null}` → 200, DB retains `fixture-local` and the lock timestamp. | See reproduction above against `/api/news-releases/<id>`. | Security property holds. The handoff test plan permits "ignored or rejected". | Consider returning an explicit error for attempted provenance mutation. Silent success can lead an integrator to believe a downgrade applied. Behaviour is correct; only the signal is ambiguous. |
| **S5-4** | 🟢 Low | migration hygiene | `src/migrations/20260818_sprint5_provenance.ts` has **no companion `.json` snapshot**; every other migration is a `.ts` + `.json` pair. The drift guard reads only the latest snapshot, which is `20260819_sprint5_content_origin_enums.json` — verified complete (22 tables, all provenance columns present), so drift detection is currently sound. | `ls src/migrations/` | Consistent snapshot pairing. | Cosmetic today because the later snapshot supersedes it. Regenerate for consistency, or document why the intermediate migration has no snapshot, so a future reviewer does not read it as a missing artifact. |

### Explicitly checked and clean
No AI provider dependency in `package.json`; no provider SDK, `fetch` or outbound URL in
`src/lib/extraction/adapter.ts` (100 lines, `providerId: 'fixture-local'`, comment "Intentionally no
fetch / no provider SDK"); extraction fixture carries exactly the specified plausible errors
(`1.20 g/t Au` → `12.0 g/t Au`, `AG-24-017` → `AG-24-071`, `g/t` → `%`).

## 4. Priority-area results

| Priority | Result |
| --- | --- |
| Production environment observation | ⚠️ Partial — see S5-2. Guards make presence inferable; PEM contents not readable. Production DB migration claim not independently verifiable without credentials; handoff records `payload_migrations` contents. |
| Media authorization beyond former cap (S4-3) | ✅ **Fixed.** `publishedReferencedMediaWhere` now paginates (`hasNextPage` loop, `MEDIA_REFERENCE_PAGE_SIZE`); no `limit: 1000` materialization. Fixture-backed by `sprint5-provenance.int.spec.ts` ("beyond the former 1000-ID materialization cap"). |
| Tenant-scoped ingestion | ✅ Cross-tenant document read → `Not Found`; patch → 403; create-in-other-tenant → 403; `/dashboard/documents/<other-tenant-id>/file` → 404. |
| Private bucket behaviour | ✅ Direct Supabase object URLs → `400 Bucket not found`, no bytes, for both published- and draft-attached keys. App route returns 200 directly with no `Location` redirect — no shareable signed URL. |
| Immutable machine-origin / provenance | ✅ Forged create → all fields stripped (`content_origin=human_authored`, audit fields NULL). Forged update → unchanged. Downgrade → DB preserves `machine_assisted`. Audit-clear → DB preserves values. |
| Reviewer source context (ADR-0015) | ✅ Rendered panel on a machine-assisted record contains "Reviewer source context" heading, machine-assisted marker, origin-locked timestamp, extraction provider, source document/location, and `name="sourceCheckAcknowledged"` alongside the status select. |
| Plausible extraction errors | ✅ Fixture returns the specified wrong grade/hole/units; reject→draft path covered by integration test; incorrect proposal never public. |
| Status-only approval | ✅ Human record: draft→published rejected; approve+content rejected; status-only approval accepted; post-publish disclosure edit rejected. Machine record: draft→published rejected; **review→published without acknowledgement rejected**; combined content+publish rejected. |
| Anonymous serialization | ✅ Zero provenance, extraction, reviewer or tenant fields across all 10 collections, live and local. Machine-assisted draft not visible anonymously. |
| Northern Copper negative fixtures | ✅ 0 poison hits across 9 API endpoints and 6 public pages; 4 slugs 404. |
| External data egress | ✅ No provider dependency, no network path in the adapter, no provider secret. |

**Note on the approval gate.** The source-check acknowledgement is a **per-request** flag supplied by the
dashboard status form, not a stored field. Setting `reviewer_source_check_*` directly in the database does
**not** satisfy it — I verified this and it is the correct design: the acknowledgement must be made by the
approver at approval time, not pre-staged. A consequence worth recording deliberately: **machine-assisted
content cannot be published through the REST API at all**, only through the dashboard action. That is a
stronger control than ADR-0015 requires.

## 5. Regressions against Sprint 1–4 gates

**None.** Tenant isolation, the disclosure gate, status-only approval, server-derived review metadata,
published-only public reads, private storage authorization, public API minimization, security headers and
the Northern fixtures all hold. Test count rose 79 → **100** with the new provenance, media-object-key and
map specs.

## 6. Remaining blockers

### Before marking Sprint 5 Done
1. **S5-1** — revert the uncommitted `importMap.js` change.
2. Product Director sign-off on the ADR-0013 no-egress decision, which the handoff records as *assumed*.

### Before customer content / real Production go-live
3. Fictional smoke seed on `bwftfsfbiyzgwztwtqmh`, then re-verify ingestion, private media, provenance and
   isolation against it.
4. Repair and verify the Vercel Preview environment.
5. Record the S5-2 guard-based observation in the handoff.
6. Vercel alias cutover — explicit Product Director decision.

### Sprint 6 backlog
S5-3, S5-4.

**No Critical or High finding is open.** Customer-content promotion remains not recommended until items
1–3 are closed.

## 7. Closing note

Four sprints running, the headline defect came from evidence gathered one layer below where the failure
occurs. Sprint 5 broke that pattern: the claims were checked at the layer that matters, and they held. The
scope discipline is the reason — declining external AI egress and shipping ingestion plus provenance
instead produced a sprint whose central control could actually be proven rather than asserted.

The strongest single design decision is making the source-check acknowledgement a per-request flag rather
than a stored field. It means no amount of database access or API cleverness can pre-satisfy the reviewer
gate. That is the difference between a control and a checkbox.
