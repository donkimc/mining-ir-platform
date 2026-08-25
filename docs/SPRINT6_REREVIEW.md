# Sprint 6 Re-Review — remediation candidate `93bf908`

**Date:** 2026-08-25
**Reviewer:** independent, defect-first
**Candidate:** `main` @ `93bf908` — *Close Sprint 6 review findings S6-7, S6-1, S6-2 and S6-3.*
**Baseline reviewed previously:** `50c2c0f` (`docs/SPRINT6_REVIEW.md`)
**Evidence standard:** ADR-0008 + `AGENTS.md` Evidence Rules 1–8.

> **Note on redaction.** This document deliberately does **not** spell out the retired
> Sprint 1–5 fixture names. Writing them here would add a third instance of the exact defect
> described in S6-7 below. Where the guard's output is quoted, the term is shown as
> `<retired-gold-name>`. The file paths and mechanism — the actual evidence — are unredacted.

---

## Verdict: **Do not ship as-is** — 0 Critical, **1 High still open**

Three of the four findings are genuinely closed, and two of them are closed at the strongest
available layer. The fourth — **S6-7, the release gate itself** — is **still open**, and the
handoff's central claim (`npm run verify` exit 0) does not reproduce on the committed tree.

| ID | Claimed | Verified | Layer of evidence |
| --- | --- | --- | --- |
| **S6-7** | Fixed | ❌ **Still open (High)** | Clean tree at `93bf908`, exit codes |
| **S6-1** | Fixed | ✅ **Closed** | Live Production hosts + code audit + real integration test |
| **S6-2** | Fixed | ✅ **Closed** | Wipe-and-regenerate; byte-identical output; library source |
| **S6-3** | Fixed | ✅ **Closed (behaviour)** | Live Production hosts + boundary-file class audit |

The remediation is genuinely good work — S6-1 and S6-2 were fixed at the class level, not the
instance level, which is what the prior review asked for. The problem is narrow and mechanical:
the release gate cannot pass on the tree that was actually committed.

---

## 1. Release gate (S6-7) — **STILL OPEN (High)**

### Reproduction — clean tree, committed candidate

```
$ git rev-parse HEAD
93bf908f01f7bd6d9931ab886b3ad4a6a7eaba9c
$ git status --porcelain
                                  # empty — clean tree

$ npm run verify ; echo $?
...
 Test Files  1 failed | 20 passed (21)
      Tests  1 failed | 124 passed (125)
1                                 # ← VERIFY_EXIT=1
```

The failing test is the one added by this very commit:

```
FAIL  tests/retired-fixtures.spec.ts > retired fixture guard (ADR-0021 / S6-7)
      > passes on the clean tracked tree (including the guard source)
AssertionError: expected [ …(2) ] to deeply equal []

+ [
+   "docs/SPRINT6_REVIEW.md matches /\b<retired-gold-name>\b/i",
+   "tests/retired-fixtures.spec.ts matches /\b<retired-gold-name>\b/i",
+ ]
```

The standalone gate fails identically:

```
$ npm run check:retired-fixtures
Retired fixture terms found outside historical allowlist:
  - docs/SPRINT6_REVIEW.md matches /\b<retired-gold-name>\b/i
  - tests/retired-fixtures.spec.ts matches /\b<retired-gold-name>\b/i
```

Because `npm test` is the third step of `verify`, the pipeline aborts there — so
`check:migration-drift`, `check:retired-fixtures` **and `build:ci` never execute.** That is the
same structural symptom as the original S6-7, moved one step earlier in the chain.

### Why the handoff says exit 0 — the mechanism

This is not a disagreement about interpretation; it is a measurable difference between the tree
Cursor tested and the tree that was committed.

`scanRetiredFixtures()` takes its input from `git ls-files` — **tracked files only**:

```ts
export function listTrackedFiles(cwd = root): string[] {
  const out = execSync('git ls-files', { encoding: 'utf8', cwd })
  return out.split('\n').filter(Boolean)
}
```

Both offending files were **added by `93bf908` itself**:

```
$ git show --name-status --format="" 93bf908 | grep '^A'
A	docs/SPRINT6_REVIEW.md
A	scripts/check-retired-fixtures.ts
A	tests/anon-api-non-tenant-hosts.int.spec.ts
A	tests/retired-fixtures.spec.ts

$ git ls-tree -r --name-only 255fff6 | grep -c 'SPRINT6_REVIEW\|retired-fixtures.spec'
0
```

Before `git add`, neither file was tracked, so the scan never saw them and the gate passed.
After the commit, both are tracked and the gate fails. The handoff's test count (**125 tests /
21 files**) matches my run exactly — the same suite ran; only the tracked-file set differed.

**This is Evidence Rule 3 (“green suite ≠ deployed behaviour”) in a new costume:** the gate was
measured against a working tree that is not the released artifact.

### Root cause — instance fixed, class not fixed

The fix added a one-element self-exclusion:

```ts
export const SELF_EXCLUDE = new Set([
  'scripts/check-retired-fixtures.ts',
])
```

But the guard's real contract is *“no tracked file may name a retired identity, except files whose
job is to name them.”* There are three kinds of such files, and only one was exempted:

| File whose job is to name retired terms | Exempted? |
| --- | --- |
| the guard source (`scripts/check-retired-fixtures.ts`) | ✅ `SELF_EXCLUDE` |
| the guard's own test (`tests/retired-fixtures.spec.ts`) | ❌ **no** |
| sprint review/handoff evidence docs (`docs/SPRINT6_REVIEW.md`) | ❌ **no** — allowlist stops at Sprint 5 |

The `HISTORICAL_ALLOWLIST` enumerates `SPRINT1`–`SPRINT5` handoff/review files individually. Every
future sprint that writes a review discussing the fixture rename will break the build again, and the
break will only appear *after* the doc is committed — the least convenient moment.

### Required fix (class, not instance)

Replace per-file enumeration with a rule, so the exemption is derived rather than remembered:

- exempt `docs/SPRINT*_REVIEW.md`, `docs/SPRINT*_REREVIEW.md`, `docs/SPRINT*_HANDOFF.md`,
  `docs/SPRINT*_CARRYFORWARD.md` and `docs/decisions/ADR-0021-*` by pattern;
- exempt the guard source **and** its test (or build the test's poison string at runtime, e.g. from
  character codes, so the literal never appears in a tracked file);
- keep the bidirectional test — its second case is well designed and does exactly what was asked.

Then re-run `npm run verify` **after `git add -A`**, not before. A gate whose input is `git ls-files`
must be measured on a staged/committed tree, or it is measuring a different program.

### Build is not broken

Run standalone, the step `verify` never reached is healthy:

```
$ npm run check:migration-drift ; echo $?    →  0
$ npm run build:ci ; echo $?                 →  0
   ✓ Compiled successfully in 28.0s
   ✓ Generating static pages (17/17)
```

So S6-7 is **only** the gate. There is no underlying build or migration defect hiding behind it.

---

## 2. Public API consistency (S6-1) — **CLOSED**

### Live Production, redirects not followed

Verified against the deployed `nrlaunch.com` hosts. `93bf908` is confirmed live: the admin-host
`/dashboard` behaviour changed from 404 (prior review) to 307, which only this commit does.

| Host | class | `/api/projects` | `/api/companies` |
| --- | --- | --- | --- |
| `nrlaunch.com` | apex | **200** `docs=0 total=0` | **200** `docs=0 total=0` |
| `www.nrlaunch.com` | www | 307 → `https://nrlaunch.com/api/projects` | 307 → apex |
| `demo.nrlaunch.com` | reserved | **200** `docs=0 total=0` | **200** `docs=0 total=0` |
| `typo.nrlaunch.com` | unknown | **200** `docs=0 total=0` | **200** `docs=0 total=0` |
| `admin.nrlaunch.com` | admin | **200** `docs=0 total=0` | **200** `docs=0 total=0` |
| `mining-ir-platform.vercel.app` | preview alias | **200** `docs=0 total=0` | **200** `docs=0 total=0` |

**No 5xx anywhere.** Bodies are the ordinary Payload envelope with an empty `docs` array — no stack
traces, no tenant identifiers, no `Something went wrong.`:

```json
{"docs":[],"hasNextPage":false,"hasPrevPage":false,"limit":10,"nextPage":null,"page":1,...}
```

The shared-helper collection (`projects`) and the own-`read` collections (`companies`, `media`) now
**agree** on every host class. That disagreement was the substance of the original finding.

### Class audit — no remaining offenders

```
$ grep -rn "resolveTenantSlug" src
src/lib/tenant.ts:121:export async function resolveTenantSlug()      # definition
src/access/index.ts:96:        // comment only
src/lib/collection-hooks.ts:66:  // comment only
src/collections/Media.ts:40:     // comment only
```

All three former call sites now use `resolveRequestTenant()` and return `{ id: { in: [] } }` when
`kind !== 'tenant'`. Every remaining `requirePublishedTenant()` caller is a render path
(`src/app/(frontend)/**/page.tsx`, plus `src/lib/seo.ts` used only from tenant-page
`generateMetadata`). `notFound()` no longer appears on any non-render path.

### The new test is real

`tests/anon-api-non-tenant-hosts.int.spec.ts` **executed** against a live local Postgres — it is not
a skipped stub:

```
✓ tests/anon-api-non-tenant-hosts.int.spec.ts (11 tests) 1326ms
```

It mocks the `Host` header and drives the Payload Local API with `overrideAccess: false, user:
undefined`, covering apex / reserved / unknown / `vercel.app`-under-`NODE_ENV=production`, across
`projects`, `companies` and `media`. It includes a **positive control** — a tenant host must still
return published projects — which is what stops it degrading into a test that passes because
everything returns nothing.

> Integration tests target `postgres://…@localhost:5432/mining_ir` from `.env.local`, and
> `vitest.setup.ts` forces `PAYLOAD_DATABASE_PUSH=false`. **Production was not touched by this review.**

---

## 3. importMap (S6-2) — **CLOSED**

Closed at the strongest layer available, and the fix addresses the actual cause.

### The cause was real and is correctly targeted

Previously the S3 plugin was conditionally omitted from `plugins[]` when `S3_*` was unset, so nothing
registered the client handler. `@payloadcms/plugin-cloud-storage` registers that dependency
**unconditionally**, outside its `enabled` check:

```js
// node_modules/@payloadcms/plugin-cloud-storage/dist/utilities/initClientUploads.js
// Ensure client handler is always part of the import map, to avoid
// import map discrepancies between dev and prod
config.admin.dependencies[clientHandler] = { type: 'function', path: clientHandler }
```

and `@payloadcms/storage-s3` calls `initClientUploads(...)` *before* its `isPluginDisabled`
early-return. So registering the plugin with `enabled: false` is the documented way to keep the
import map stable — not a workaround. `enabled: false` is genuinely honoured
(`storage-s3/dist/index.js:29`, `plugin-cloud-storage/dist/plugin.js:17`), so local filesystem media
is unaffected.

### Empirical proof — wipe and regenerate

Regeneration alone only proves the file was left alone, so I destroyed it first:

```
$ echo 'export const importMap = {}' > 'src/app/(payload)/cms/importMap.js'
$ grep -c S3ClientUploadHandler …/importMap.js        →  0

$ S3_BUCKET= S3_ENDPOINT=  npm run generate:importmap
Writing import map to …/src/app/(payload)/cms/importMap.js

$ grep -c S3ClientUploadHandler …/importMap.js        →  4
$ git diff --stat 'src/app/(payload)/cms/importMap.js'
                                  # empty — byte-identical to the committed file
$ npx vitest run tests/importmap-s3-handler.spec.ts
 Test Files  1 passed (1)
```

**The committed file is exactly what the generator produces with no S3 credentials.** That is the
property that makes dev runs safe: there is no longer a diff for `npm run dev` to introduce, and no
incentive for anyone to commit a stripped file to make the test go green.

A plain `generate:importmap` on the untouched tree reports `No new imports found, skipping writing
import map`, and `git status --porcelain` stays empty.

Also worth noting: the committed map's handler hash is now a full 32-hex-character generated
identifier, replacing the previous 31-character hand-written one — corroborating that this file is
now real generator output rather than maintained by hand.

---

## 4. Admin unauth redirect (S6-3) — **CLOSED (behaviour)**

### Live Production, redirects not followed

| Host | `/dashboard` unauthenticated |
| --- | --- |
| `admin.nrlaunch.com` | **307 → `/login?next=/dashboard`** |
| `mining-ir-platform.vercel.app` | **307 → `/login?next=/dashboard`** |
| `nrlaunch.com` (apex) | 307 → `https://admin.nrlaunch.com/dashboard` |
| `demo.nrlaunch.com` (reserved) | 307 → `https://admin.nrlaunch.com/dashboard` |
| `typo.nrlaunch.com` (unknown) | 307 → `https://admin.nrlaunch.com/dashboard` |
| `qelvarion-resource.nrlaunch.com` (tenant) | 307 → `https://admin.nrlaunch.com/dashboard` |

The prior review's specific complaint — *tenant hosts redirect to a URL that then 404s* — is
resolved: the redirect target now serves a 307 to the login page rather than a dead 404. Session
expiry lands a Company Admin on a login prompt.

`admin.nrlaunch.com/` also redirects to `/login`, consistently.

### Class audit — clean

Every error/not-found/layout boundary was checked for tenant-requiring calls:

```
src/app/(frontend)/layout.tsx              — clean
src/app/(frontend)/not-found.tsx           — comments only
src/app/(frontend)/admin/layout.tsx        — clean
src/app/(frontend)/dashboard/layout.tsx    — clean
src/app/(payload)/layout.tsx               — clean
src/app/(payload)/cms/[[...segments]]/not-found.tsx — clean
```

No boundary component calls `requirePublishedTenant()`, `resolveTenantSlug()` or `notFound()`. The
fix is the class fix, not a catch-all redirect — which is what was asked for.

### Honest limit on the cause claim

The handoff asserts a specific mechanism: the nested `notFound()` inside the not-found boundary won
over `requireUser()`'s `redirect()`. That claim is **consistent with the code and with the observed
before/after behaviour**, and the code change is clearly load-bearing. But I did not instrument
Next's rendering to prove that ordering directly. I am closing S6-3 on **behaviour verified at the
deployed layer**, not on a proven mechanism. If the symptom ever returns, treat the mechanism as
still unproven.

---

## 5. Regression matrix — Sprint 1–6 contracts

### Host × path (live Production, redirects not followed)

| Host | `/` | `/projects` | `/dashboard` (unauth) | `/api/projects` | `/api/companies` |
| --- | --- | --- | --- | --- | --- |
| `nrlaunch.com` (apex) | 200 marketing | 404 | 307 → admin | 200 `docs=0` | 200 `docs=0` |
| `www.nrlaunch.com` | 307 → apex | 307 → apex | 307 → apex | 307 | 307 |
| `qelvarion-resource.…` | 200 tenant | 200 | 307 → admin | 200 `docs=2` | 200 `docs=1` |
| `zenthoriq-resource.…` | 200 tenant | 200 | 307 → admin | 200 `docs=1` | 200 `docs=1` |
| `veylithra-tungsten.…` | 200 tenant | 200 | 307 → admin | 200 `docs=2` | 200 `docs=1` |
| `admin.nrlaunch.com` | 307 → `/login` | 404 | **307 → `/login?next=`** | 200 `docs=0` | 200 `docs=0` |
| `demo.nrlaunch.com` (reserved) | 404 | 404 | 307 → admin | 200 `docs=0` | 200 `docs=0` |
| `typo.nrlaunch.com` (unknown) | 404 | 404 | 307 → admin | 200 `docs=0` | 200 `docs=0` |
| `mining-ir-platform.vercel.app` | 404 | 404 | 307 → `/login?next=` | 200 `docs=0` | 200 `docs=0` |

**Zero 5xx.** Every cell is an intentional 200 / 307 / 404.

> **Self-correction during this review.** My first pass probed `qelvarion.nrlaunch.com` and read
> `docs=0` as “every tenant is broken.” The real subdomains are `qelvarion-resource`,
> `zenthoriq-resource`, `veylithra-tungsten` (`src/seed/index.ts:227,300,354`); my hosts were
> unknown labels correctly returning empty. Verified against the seed before filing anything.

### Disclosure gate and field stripping

Anonymous reads across `projects`, `companies`, `news-releases`, `documents`, `media`,
`company-listings`, `exploration-contents`, `share-structures`, `people`, `catalysts`,
`investment-highlights` on all three tenant hosts:

- every returned record has `status: "published"` (companies: `"active"`); no Draft, Review or
  Archived record appeared;
- **zero** banned keys, checked by walking every key of every returned object rather than substring
  matching: `reviewedBy`, `reviewedAt`, `publishedAt`, `tenant`, `websiteDomain`, `subdomain`,
  `templateKey`, `contentOrigin`, `originLockedAt`, `extraction*`, `reviewerSourceCheck*`,
  `sourceCheckAcknowledged`;
- `users` and `tenant-memberships` return **403** on every tenant host;
- tenant HTML contains no draft fixtures (`mistfall`, `draft-technical-memo`, `draft-financing`,
  `draft-tungsten`, poison strings) — all three hosts clean;
- apex HTML mentions “Draft”, “isolation” only in marketing prose describing the workflow, not as data.

### Cross-tenant containment

| Host | Records served |
| --- | --- |
| `qelvarion-resource` | company `[qelvarion-resource]`, projects `[greywater-flats, northridge-belt]` |
| `zenthoriq-resource` | company `[zenthoriq-resource]`, projects `[hollowspire-isolation]` |
| `veylithra-tungsten` | company `[veylithra-tungsten]`, projects `[fennwick-drift, hollowspire-ridge]` |

No tenant serves another's records.

> **False positive disproved.** A substring sweep flagged `hollowspire-isolation` and
> `zenthoriq-isolation` on the Zenthoriq host. These are Zenthoriq's **own** seeded isolation
> fixtures (`src/seed/index.ts:966,1065,1081`) served on their own host — correct. The word
> “tenant” likewise appeared only inside a description string (“cross-tenant assignment checks”),
> not as a JSON key. Key-level inspection returned clean everywhere.

### Media authorization

| Request | Result |
| --- | --- |
| Qelvarion media from `qelvarion-resource` host | **200** `application/pdf` |
| Qelvarion media from `veylithra-tungsten` host | **403** |
| Veylithra media from `qelvarion-resource` host | **403** |
| Qelvarion media from apex `nrlaunch.com` | **403** |
| Direct Supabase object, `…/storage/v1/object/public/media/<key>` | **400** `NoSuchBucket` |
| Direct Supabase object, `…/storage/v1/object/media/<key>` | **400** `NoSuchBucket` |

Cross-tenant media containment holds. **Caveat on the last two rows:** the response is
`Bucket not found`, so this proves no public object path exists under the bucket name `media` — it
does not prove the *actual* production bucket is private, because the real `S3_BUCKET` value is
operator-held and not present locally. Treat direct-storage privacy as carried forward from the
prior review, not re-proven here.

---

## 6. New findings

### N-1 — `resolveTenantSlug()` is now dead code that still calls `notFound()` (Low)

```
$ grep -rn "resolveTenantSlug" src tests scripts | grep -v definition | grep -v comment
                                  # no results
```

The function is exported, unreferenced, and its body is `notFound()` on any non-tenant host — the
exact primitive that caused S6-1. Leaving a documented-looking helper in place invites a future
caller to reintroduce the defect from an access function. Either delete it, or mark it
`@deprecated` with an explicit “render paths only — never inside access control” note. Its
docstring currently says “Sprint 1-compatible slug helper used by public pages”, which reads as an
endorsement.

### N-2 — S6-7's fix pattern will recur each sprint (folded into S6-7)

Covered above; the `HISTORICAL_ALLOWLIST` grows by hand every sprint and the failure only surfaces
after commit. Recorded here so it is not lost if S6-7 is closed narrowly.

---

## 7. Status of findings not in scope for this pass

Not fixed in `93bf908` by design. I re-checked whether the prior descriptions are still accurate —
**none is closed**:

| ID | Prior severity | Still accurate? |
| --- | --- | --- |
| **S6-4** summit is a colour variant, not a distinct shell | Medium | ✅ Yes — `.template-summit` 8 declarations, `.template-summit .display` 1, `.summit-hero` 1. Still tokens + one letter-spacing + one gradient. |
| **S6-5** multi-listing schema, no multi-listing fixture | Low | ✅ Yes — every tenant has exactly **1** listing (`TSXV`, `TSXV`, `CSE`). The multi-row path remains unexercised. |
| **S6-6** live document links to an unrelated third-party site | Low | ✅ Yes — **still live on Production.** `veylithra-tungsten` `corporate-presentation` has `externalUrl: https://dario-amodei-machines-of-loving-grace.tiiny.site`. Two other documents still point at `https://example.com/…`. |

S6-6 is worth pulling forward: it is a public, customer-facing link on a live investor-relations
site pointing at an unrelated third-party domain the project does not control. It stays Low only
because the tenants are fictional demos.

---

## 8. Not verified

Stated explicitly rather than assumed:

1. **`admin.nrlaunch.com/dashboard` with a valid session → 200.** Credentials are operator-held;
   I did not request or use them. The prior review verified this at `50c2c0f`; it is **not**
   re-verified at `93bf908`.
2. **The S6-3 mechanism.** Behaviour verified; Next's notFound-vs-redirect ordering not instrumented.
3. **Local `next start` host matrix.** Not run. `.env.local` sets `PAYLOAD_DATABASE_PUSH=true`, and
   pointing a push-enabled local server at a Supabase database risks schema mutation. The live
   Production matrix covers the same cells at the layer that actually matters, so the local run adds
   little and carries real risk. The handoff's note that Production TLS settings blocked its own
   local matrix is consistent with what I observed.
4. **Production bucket privacy** — see the caveat in §5; bucket name is operator-held.
5. **Production restore rehearsal, deployed-env observation of `DATABASE_SSL_CA` /
   `PAYLOAD_DATABASE_PUSH`, rollback exercise.** Unchanged operator gates, still open.
6. **Whether `93bf908` is the exact deployed build.** Inferred from the S6-3 behaviour change
   (404 → 307), which only this commit produces. There is no build-SHA endpoint to confirm it
   directly; adding one would remove this inference for future reviews.

---

## 9. Recommendation

**Do not promote customer content.** One High (S6-7) remains open, and the standing rule is that no
Critical or High may be open at promotion.

Ordered next steps:

1. **Fix S6-7 by rule, not by adding two more names to a list.** Exempt sprint evidence docs by
   glob and the guard's test (or synthesise its poison string at runtime).
2. **Re-run `npm run verify` after `git add -A`, and paste the exit code.** The gate reads
   `git ls-files`; measuring it on an unstaged tree measures a different program. This single habit
   change is what turns S6-7 from recurring into closed.
3. Confirm `build:ci` executes within `verify` — standalone it already exits 0, so this should
   follow immediately once step 1 lands.
4. Address N-1 (delete or re-annotate `resolveTenantSlug`) — cheap, and it removes the reload path
   back to S6-1.
5. Then S6-6, S6-4, S6-5 and the operator gates on their own schedule.

S6-1, S6-2 and S6-3 need no further work. S6-2 in particular is now closed at a stronger layer than
the original finding demanded.

---

## 10. Method note — what this pass adds to the Evidence Rules

Rule 3 says a green suite is not deployed behaviour. Sprint 6's remediation shows the mirror image:
**a green gate is not a green artifact.** `check:retired-fixtures` derives its input from
`git ls-files`, so its result depends on what has been staged — the one variable nobody thinks of as
program input. Cursor ran it honestly and got 0; the committed tree gets 1; both observations are
correct about different trees.

The general form, worth adding as **Evidence Rule 9**:

> **Verify the artifact you are shipping, not the workspace you built it in.** When a check reads
> repository state — tracked files, git metadata, lockfiles, env — its result is a function of that
> state. Run it on the committed tree, after staging, before claiming a gate is green.

This is also the third consecutive sprint in which the *release gate itself* — not the product —
carried the headline defect. The product code in this candidate is in good shape; the machinery
that certifies it is what keeps failing.
