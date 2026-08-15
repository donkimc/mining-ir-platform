# Sprint 2 Remediation Re-Review

**Reviewer:** Claude (Opus 5), defect-first re-review
**Date:** 2026-08-12
**Baseline:** [`SPRINT2_REVIEW.md`](./SPRINT2_REVIEW.md) — findings C1, H1, H2, H3, M1–M5, L1–L8
**Head reviewed:** `9b9e774` on `main`
**Verdict:** ❌ **No-ship for Production** — see [Verdict](#verdict)

---

## Scope

Verification of the remediation commits, plus a regression guard on the Sprint 1 and Sprint 2 surface.
The whole Sprint 2 surface was not re-reviewed from scratch; new findings below are either remediation
gaps or defects introduced by the remediation.

**Local verification reproduces the claim in full:** `npm run verify` passes — lint, typecheck,
**48/48 tests** across 5 files (including a new `tests/media-access.int.spec.ts`), and a production build.

### Test artifacts created and removed

| Environment | Created | Removed |
| --- | --- | --- |
| Local | 1 news release, 1 person, 1 Northern Copper investment highlight | ✅ all deleted, verified |
| Staging | none — Preview runs a pre-remediation build | n/a |

Repo left clean (0 uncommitted files); local database left at seed state.

---

# Verdict

<a name="verdict"></a>

**No-ship for Production.** The code remediations are largely real and well-executed — C1's app-side
gate, M1, M4 and M5 are genuinely fixed, each confirmed against a running server. Three things block
promotion:

1. **The C1 remediation is not deployable — `/api/media` is broken on staging.** The fix added a schema
   column with no migration, so on any migration-based environment the media collection errors. The
   Critical fix is inert in the cloud. See [N5](#n5).
2. **M2 is only half done.** The four Sprint 1 publishable collections were not migrated, so
   `/api/projects` and `/api/companies` still expose review metadata, and `companies` still returns
   both tenants. `projects` carries `technicalSummary`, `sourceLinks` and `ownershipPercent` — the most
   disclosure-heavy public collection in the product. Raised to **High** as [N1](#n1). Confirmed on
   staging as well as locally.
3. **Owner actions remain open** — C1 bucket privacy above all. The app-side gate is now excellent, but
   it is not the whole fix.

**Fix before promotion:** [N5](#n5) (High), [N1](#n1) (High) and [N2](#n2) (Medium).
[N3](#n3), [N4](#n4) and L5 are Sprint 3 cleanup.

> **Staging URL correction (2026-08-12, second pass).** The URL recorded in `SPRINT2_HANDOFF.md`
> (`…-apmjvq9hy-…vercel.app`) is a stale immutable deployment still serving the pre-remediation build.
> The current build is live at **https://mining-ir-platform.vercel.app** (and the
> `mining-ir-platform-donkimc.vercel.app` alias). The checks originally marked *blocked* were re-run
> against the correct host; results are folded in below.

---

# Remediation status

| ID | Prior | Status | Evidence |
| --- | --- | --- | --- |
| **C1** app-side | 🔴 Critical | ✅ **Fixed** | Anon `GET /api/media/file/<draft-attached>` → **403**; `<published-attached>` → **200**. Anon `/api/media` lists 1 of 2 records; `findByID` on draft-attached → `Not Found`. Keys UUID-prefixed (`98a2f0c0-…-aurora-gold-corporate-presentation.pdf`), `originalFilename` retained. `url` is `/api/media/file/…`; `afterRead` scrubs any `storage.supabase.co` URL (`Media.ts:148-164`) and `generateFileURL` overrides the plugin default (`payload.config.ts:112-114`). |
| **C1** bucket privacy | 🔴 Critical | ⚠️ **Still open — owner** | Not verifiable: staging has 0 media and runs the old build. |
| **H1** secret rotation | 🟠 High | ⚠️ **Still open — owner** | Human task; out of scope for code. |
| **H2** push opt-in | 🟠 High | ✅ **Fixed** (residual → [N2](#n2)) | `payload.config.ts:33` `=== 'true'`. Subprocess-tested: prod + push=true → **throws**; push unset → no throw, push off. |
| **H3** DB TLS | 🟠 High | ✅ **Fixed** (residual → [N2](#n2)) | `resolveDatabaseSsl()` `payload.config.ts:41-60`. CA path pins with `rejectUnauthorized: true`; prod + `REJECT_UNAUTHORIZED=false` → **throws**. Preview must still set `DATABASE_SSL_CA`. |
| **M1** disclosureLevel | 🟡 Medium | ✅ **Fixed** | People (`requireSource:false`) + `technical` + no source → review **rejected**; same record at `standard` → **allowed**; published `disclosureLevel` downgrade → **rejected**. `disclosureLevel` present in all five disclosure-field lists (`publishing.ts:21,33,42,54,65`). |
| **M2** anon tenant scoping | 🟡 Medium | ⚠️ **Partially fixed** | Five Sprint 2 collections: single tenant, review metadata stripped ✅. `projects` → tenants **11 and 12** with `reviewedBy`/`reviewedAt`/`publishedAt` **present**; `companies` same; `investment-highlights`/`catalysts` have no tenant filter (proved latent). See [N1](#n1). |
| **M3** migration | 🟡 Medium | ⚠️ **Still open — owner** | By design, before promotion. |
| **M4** mobile hero | 🟡 Medium | ✅ **Fixed** | 375×812: header **84px** (was 206), hero **812px** = viewport (was 930), `<h1>` at y=526 with both CTAs above the fold. Menu button toggles `aria-expanded` false→true, label → "Close menu"; all 10 menu links **44px**. No horizontal overflow. |
| **M5** upload fixture | 🟡 Medium | ✅ **Fixed** | media 94 → published doc 86; media 95 → draft doc 87 — exactly the pair needed to test C1, and used by the new `media-access.int.spec.ts`. |
| **L1** uncommitted | 🟢 Low | ✅ **Fixed** | `git status` → 0. |
| **L2** test count | 🟢 Low | ✅ **Fixed** | Handoff records 48/48; observed 48/48. |
| **L3** `Number()` coercion | 🟢 Low | ✅ **Fixed** | No `Number(` on relation ids in any action or schema module. |
| **L4** security headers | 🟢 Low | ✅ **Fixed** | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, CSP served. CSP retains `'unsafe-inline' 'unsafe-eval'` on `script-src` — normal for Next without nonces; worth tightening later. |
| **L5** tap targets | 🟢 Low | ⚠️ **Partially fixed** | Nav/menu now 44px ✅. Footer `mailto:` link still **20px** on every page. Three homepage prose links at 19px fall under WCAG 2.2's inline exception, so the footer link is the one real miss. |
| **L6** nav links | 🟢 Low | ✅ **Fixed** | Investors + Corporate restored (`SiteHeader.tsx:14-15`); both routes 200. |
| **L7** missing relation | 🟢 Low | ❌ **Still open — fix is ineffective** | See [N3](#n3). Live: `PATCH {"project":999999}` still returns a bare `Not Found`. |
| **L8** Northern project | 🟢 Low | ✅ **Fixed** | Project id 183 on tenant 12; cross-tenant relation assignment correctly rejected against it. |

## Regression guard — all clean

| Check | Result |
| --- | --- |
| Forged `reviewedBy`/`reviewedAt` on create | ✅ stripped (`reviewed_by_id` null in DB) |
| draft → published | ✅ rejected |
| review → published **+ body change** | ✅ rejected |
| review → published (status only) | ✅ allowed, server-stamped reviewer |
| published → edit disclosure field | ✅ rejected |
| Cross-tenant relation assignment | ✅ rejected |
| Sprint 1 + Sprint 2 public routes (11) | ✅ all 200 |
| Dashboard routes (8, authenticated) | ✅ all 200 |
| Company Admin → `/admin/tenants` | ✅ 307 `?error=unauthorized` |
| Platform Admin → `/admin/*` | ✅ 200 |
| Draft news publicly | ✅ 404 |
| M2 edge cases | ✅ unknown tenant → empty (no crash); GraphQL anon → scoped + stripped; company admin → own tenant incl. drafts; platform admin → all |

---

# New findings

## N1
### 🟠 High — The M2 fix stopped at the Sprint 2 collections; Sprint 1's still leak cross-tenant

**Area:** tenant / public-leak
**Evidence:** live; `src/collections/Projects.ts` (anon read), `InvestmentHighlights.ts:35-38`,
`Catalysts.ts`, `Companies.ts`

Only the five new collections were migrated to `publishedOnlyOrTenantScopedRead()` +
`stripReviewMetadataAfterRead`:

```
Documents / ExplorationContents / NewsReleases / People / ShareStructures  → shared-read, stripped
Projects / Companies / InvestmentHighlights / Catalysts                    → OWN-read, NOT stripped
```

Confirmed anonymously on Aurora's host:

```
GET /api/projects              → tenants [11, 12] · reviewedBy, reviewedAt, publishedAt present
GET /api/companies             → tenants [11, 12] · review metadata present
GET /api/investment-highlights → returned a seeded Northern Copper record ("NORTHERN SECRET")
```

`investment-highlights` and `catalysts` only *looked* clean because Northern Copper has none seeded —
their access is still `{ status: published }` with no tenant filter. The leak was proved by inserting
one record and observing it on Aurora's host, then removing it.

**Why it matters.** `projects` is the most disclosure-heavy public collection: `technicalSummary`,
`sourceLinks`, `ownershipPercent`. Serving a competitor's project record from a tenant's own API origin
is the same defect M2 named, in the collection where it matters most. The remediation reads as complete
from the commit message but covers roughly half the publishable surface.

**Fix.** Move `Projects`, `InvestmentHighlights` and `Catalysts` onto `publishedOnlyOrTenantScopedRead()`
and add `stripReviewMetadataAfterRead` to all three plus `Companies`. For `Companies`, keep the
multi-tenant listing if Platform Admin needs it, but strip review metadata for anonymous callers.

## N2
### 🟡 Medium — The H2/H3 production guards are bypassed during the Next build phase

**Area:** staging · **Evidence:** `payload.config.ts:34-39, 48-52`; subprocess-tested across five env permutations

```
prod + push=true          (runtime)      → THREW ✅
prod + push=true          (BUILD phase)  → NO THROW ⚠️
prod + ssl reject=false   (runtime)      → THREW ✅
prod + ssl reject=false   (BUILD phase)  → NO THROW ⚠️
```

`isNextProductionBuild` (`NEXT_PHASE === 'phase-production-build'`) disables both guards. Vercel builds
run with `NODE_ENV=production`, that exact phase, and the project's env vars available. Setting
`PAYLOAD_DATABASE_PUSH=true` in Vercel therefore lets Payload initialise with push enabled **during the
build**, against whatever `DATABASE_URI` is configured; the runtime guard then fails the deploy — after
any schema change has already happened. The escape hatch reopens the exact scenario H2 exists to
prevent, one step earlier in the pipeline.

**Fix.** During the build phase, don't skip the guard — skip the *database connection*. Keep the throw
for `push=true` + production regardless of phase, and if a build-time Payload init genuinely needs to
succeed without a database, force `push: false` in that phase rather than waiving the check.

## N5
### 🟠 High — The C1 remediation shipped a schema change with no migration; `/api/media` is broken on staging

**Area:** staging / regression · **Evidence:** live on `https://mining-ir-platform.vercel.app`; `src/migrations/`

```
GET /api/media?limit=1   (anon) → {"errors":[{"message":"Something went wrong."}]}
GET /api/media/1         (anon) → {"errors":[{"message":"Something went wrong."}]}
GET /api/documents       (anon) → 200 ✅
GET /api/people          (anon) → 200 ✅
```

The failure is isolated to `media` — every other collection responds normally.

**Root cause.** The C1/M5 work added `media.originalFilename` (`Media.ts:183-189`). No migration was
generated for it: `src/migrations/` still contains only `20260812_061650_sprint2_content`, and
`grep -rl original_filename src/migrations/` returns nothing. Locally the column exists because
`PAYLOAD_DATABASE_PUSH=true` pushes it. Staging correctly runs `PAYLOAD_DATABASE_PUSH=false`
(the H2 fix), so the column was never created and every `media` query hits a missing column.

**Why it matters.** C1 was the Critical finding. Its remediation is correct in code and verified
locally, but **cannot run in any migration-based environment** — which is every environment that
matters. The H2 fix is what exposed this: `push: true` had been silently papering over missing
migrations everywhere.

It also means the C1 gate cannot be validated on staging at all until this is fixed, and by extension
neither can bucket privacy or upload durability.

**Fix.** Run `npm run migrate:create` to generate the migration for `media.originalFilename`, apply it
to staging, and re-run the C1 checks. Then add a CI guard that fails when the Payload schema drifts from
the committed migrations — this class of defect is invisible to `npm run verify` because local runs with
push enabled.

## N3
### 🟢 Low — L7's fix cannot work: `NotFound` extends `APIError`

**Area:** other · **Evidence:** `publishing.ts:273-276`; verified `new NotFound() instanceof APIError === true`

```ts
} catch (error) {
  if (error instanceof APIError) throw error          // ← NotFound satisfies this
  throw new APIError(`${label} must belong to the same tenant.`, 400)
}
```

Payload's `NotFound` is a subclass of `APIError`, so the guard rethrows it untouched and the mapping
never runs. Live: `PATCH {"project":999999}` still returns a bare `Not Found`. The commit is a no-op for
the case it targets.

**Fix.** Narrow the check to the intended error — `if (error instanceof APIError && error.status === 400)
throw error`, or set a sentinel on the tenant-mismatch error and test for that.

## N4
### 🟢 Low — Anonymous media reads run three unbounded queries and silently cap at 1000

**Area:** other · **Evidence:** `Media.ts:29-94`

`publishedReferencedMediaWhere` runs on **every** anonymous media read: one `companies` query plus two
`find`s at `limit: 1000`, then materialises an `id IN (…)` set. Every image on every public page pays
that cost, and past 1000 published documents or people the tail silently loses media access — a
correctness cliff that presents as randomly broken images.

**Fix.** Express it as a join/subquery on the media id rather than materialising the set, or cache the
id set per request.

---

# Verified live vs code-only

**Verified live** (running Next server + Postgres, local): C1 media gate in both directions, UUID keys
and proxied URLs, M1 all three cases, M2 across all ten collections including the seeded-leak proof, M4
measurements and menu interaction, L4 headers, L5 tap-target measurements, L6 routes, L7 failure, L8
fixture, the full disclosure-gate regression battery, cross-tenant relation rejection, all 19 routes,
role separation, and M2 edge cases (unknown tenant, GraphQL, authenticated, platform admin). H2/H3
guards subprocess-tested across five env permutations.

**Code-only:** the CSP's practical strength; `generateFileURL` behaviour under a real S3 backend (local
has no `S3_*`, so `useS3Storage` is false — the URL-scrubbing path is exercised only by `afterRead`).

**Verified live on staging** (`https://mining-ir-platform.vercel.app`, second pass): L4 headers (3
present), L6 nav, M4 mobile menu, M2 scoping and metadata stripping across the five Sprint 2
collections, N1 on `projects`/`companies`, and the `/api/media` failure ([N5](#n5)).

**Still unverified:** bucket privacy (staging has 0 media and the media API is down), `DATABASE_SSL_CA`,
and Supabase-backed upload durability. A probe of the public object path returns `NoSuchKey` — the
bucket resolves anonymously, which is consistent with it still being public, but is not conclusive.

---

# Remaining owner actions before Production

1. **Correct the Preview URL in `SPRINT2_HANDOFF.md`** to `https://mining-ir-platform.vercel.app`.
   The recorded immutable URL still serves the pre-remediation build, which cost this review a full
   pass of false "blocked" results.
2. **Apply the missing `media.originalFilename` migration to staging** ([N5](#n5)), then re-run the C1
   media checks there — they have never been executed against a remediated cloud build.
3. **Set the Supabase `media` bucket to `public = false`** — still the actual C1 fix. The app-side gate
   is strong now, but it only governs Payload's route; a public bucket bypasses it entirely. Re-test
   with a draft-attached upload after redeploy.
4. **Rotate** `PAYLOAD_SECRET`, the Supabase database password, the S3 keys, and both staging admin
   passwords.
5. **Set `DATABASE_SSL_CA`** on Preview and remove `DATABASE_SSL_REJECT_UNAUTHORIZED=false`. Note the
   runtime guard will hard-fail Production if that variable is still set — good, but it means the CA
   must be in place *before* promotion, not after.
6. **Generate and test the incremental migration** (M3) against a Sprint 1-shaped database.

> **In-flight change not reviewed.** The working tree carries uncommitted edits to
> `src/payload.config.ts` and `.env.example` (not part of `9b9e774`) adding an
> `ALLOW_INSECURE_DB_SSL=true` escape hatch that permits `rejectUnauthorized: false` **in production**.
> That is one environment variable away from re-opening H3 in the environment H3 was raised for. If it
> ships, it needs an explicit ADR note and a hard expiry.

---

# Observation

The remediation quality is high where a finding named a file, and thinner where a finding implied a
*class* of problem. M2 said "the anonymous API leaks across tenants"; the fix covered the collections
Sprint 2 created and stopped at the boundary of the sprint rather than the boundary of the defect.
L7's catch block reads correct and is inert.

Both would have been caught by asking, after each fix, **"what else has this shape?"** — a cheaper habit
than another review round.
