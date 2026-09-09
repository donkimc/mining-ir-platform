# Sprint 6 Re-Review #2 — remediation candidate `5dfa1a1`

**Date:** 2026-08-25
**Reviewer:** independent, defect-first
**Candidate:** `main` @ `5dfa1a1` — *Close Sprint 6 re-review: S6-7 gate, summit shell, seed and listings.*
**Baselines:** `docs/SPRINT6_REREVIEW.md` (re-review of `93bf908`), `docs/SPRINT6_REVIEW.md` (original, `50c2c0f`)
**Evidence standard:** ADR-0008 + `AGENTS.md` Evidence Rules 1–8.

> **Redaction — and a live demonstration of N-2 below.** This file does not spell out the retired
> Sprint 1–5 fixture names. That is not only convention here: the new exemption rule matches
> `^docs/SPRINT\d+_REREVIEW\.md$`, and **this file is `SPRINT6_REREVIEW2.md`, which does not match**.
> Writing a literal retired term here would turn the gate red again. Terms appear as
> `<retired-gold-name>`.

---

## Verdict: **Ship with conditions** — 0 Critical, 0 High

Every finding carried into this pass is closed, and the two that mattered most — the release gate
and the summit shell — are closed at the layer that actually matters, verified on live Production.
No regression was found in S6-1, S6-2 or S6-3.

The remaining conditions are not code defects: one live CMS value the operator must clear, one
fixture that exists in seed but was never seeded to Production, and the standing ADR-0020 operator
gates.

| ID | Claimed | Verified | Evidence layer |
| --- | --- | --- | --- |
| **S6-7** High | Gate passes on committed tree | ✅ **Closed** | Clean committed tree, exit codes, bidirectional inject |
| **N-1** Low | `resolveTenantSlug()` deleted | ✅ **Closed** | Source audit — symbol gone repo-wide |
| **S6-4** Medium | Real shell, not colour-only | ✅ **Closed** | Live Production HTML, both templates, all 9 public routes |
| **S6-5** Low | Multi-listing fixture + test | ⚠️ **Closed in code; not on Production** | Seed + passing test; live Veylithra still 1 listing |
| **S6-6** Low | Seed fixed; live operator-only | ⚠️ **Seed closed; live partly open** | Third-party URL gone; one `example.com` still live |
| S6-1 / S6-2 / S6-3 | (previously closed) | ✅ **No regression** | Live matrix + importMap regeneration |

---

## 1. Release gate (S6-7) — **CLOSED**

### Measured on a clean committed tree

```
$ git rev-parse --short HEAD
5dfa1a1
$ git status --porcelain
                                  # empty — clean, committed

$ npm run verify ; echo $?
...
 Test Files  22 passed (22)
      Tests  130 passed (130)
check:retired-fixtures PASS
> build:ci
> cross-env … PAYLOAD_DATABASE_PUSH=false next build
 ✓ Compiled successfully in 29.0s
 ✓ Generating static pages (17/17)
0                                 # ← VERIFY_EXIT=0
```

All six steps executed in order — lint, typecheck, 130 tests / 22 files, `check:migration-drift`,
`check:retired-fixtures`, and **`build:ci`**. The two lines the brief requires as proof that the
build actually ran are present. This is the first Sprint 6 candidate on which `verify` has genuinely
reached the build step.

### The gate still bites — bidirectional, on the staged tree

A gate that cannot fail is worth as little as one that cannot pass:

```
$ printf '// <retired-gold-name> retired term probe\n' > src/poison-probe-tmp.ts
$ git add -N src/poison-probe-tmp.ts       # must be tracked — the scan reads `git ls-files`
$ npm run check:retired-fixtures ; echo $?
Retired fixture terms found outside historical allowlist:
  - src/poison-probe-tmp.ts matches /\b<retired-gold-name>\b/i
1                                          # ← INJECTED_EXIT=1

$ git reset -q src/poison-probe-tmp.ts && rm src/poison-probe-tmp.ts
$ npm run check:retired-fixtures ; echo $?
0                                          # ← REMOVED_EXIT=0
$ git status --porcelain                   # empty
```

### The fix is the class fix

`HISTORICAL_ALLOWLIST` (13 hand-maintained paths) is replaced by `HISTORICAL_PATH_PATTERNS`, and the
test's poison string is synthesised at runtime via `String.fromCharCode(...)`, so no tracked test
file contains a literal retired term and none needs exempting. A third test asserts the *rule*:

```ts
expect(isExcludedFromScan('docs/SPRINT9_REVIEW.md')).toBe(true)
expect(isExcludedFromScan('src/anything.ts')).toBe(false)
```

That is the shape the prior re-review asked for — a future `SPRINT7_REVIEW.md` cannot re-break the
gate. Confirmed empirically: `docs/SPRINT7_REVIEW.md` → exempt, `docs/SPRINT10_HANDOFF.md` → exempt.

`PATTERNS` was not weakened — all 10 retired-term patterns remain, and `check:retired-fixtures` is
still the fifth step of `verify`. See **N-2** for the residual gap in the pattern set.

---

## 2. N-1 (dead `resolveTenantSlug`) — **CLOSED**

```
$ grep -rn "resolveTenantSlug" src tests scripts
                                  # no results — symbol deleted repo-wide
```

Deleted outright rather than deprecated, which is the stronger of the two options I offered: a
`@deprecated` helper can still be imported, and this one's body was `notFound()` — the exact
primitive behind S6-1.

Every remaining `notFound()` in `src/access`, `src/lib/collection-hooks.ts` and `src/collections` is
a **comment**; all live calls are in page render paths under `src/app/(frontend)/**/page.tsx` plus
`src/lib/tenant.ts`. `not-found.tsx` still does not call it.

---

## 3. Summit shell (S6-4) — **CLOSED**, verified live

Product Director chose option (a). ADR-0017 carries a dated 2026-08-25 clarification recording that
choice and explicitly declining the theme-variant reclassification.

### Live Production evidence

`5dfa1a1` is confirmed deployed — the summit markers below exist only in this commit.

| Route | Veylithra (`summit`) | Qelvarion (`explorer`) |
| --- | --- | --- |
| `/` | `data-template="summit"`, **62** `summit-*` class occurrences | `data-template="explorer"`, 0 |
| `/` markers | `summit-ticker-bar`, `summit-metric-rail`, `summit-section-rule`, `summit-doc-rail`, `summit-section`, `summit-hero` | none |

This is not colour-only. The two homepage components differ in section order (summit puts flagship
before thesis and highlights; explorer puts thesis first), in grid ratios
(`1.2fr_0.8fr` vs `0.9fr_1.1fr`), in list density (`space-y-0` vs `space-y-6`) and in heading scale.

### Class check — the shell is homepage-scoped, but the template is not

The homepage refactor alone would have left summit as a colour variant on the other eight public
routes. It does not, because navigation differs on **every** page:

| Route | summit nav | explorer nav |
| --- | --- | --- |
| `/`, `/about`, `/projects`, `/contact` (identical on each) | `Investors, Projects, Documents, About, Contact` (5, IR-first) | `About, Projects, News, Documents, Management, Share structure, Investors, Contact` (8) |

So a summit tenant differs from an explorer tenant on all nine public routes — structurally on the
homepage, navigationally everywhere. ADR-0017's clarification scopes the shell work to "homepage
shells, summit nav order, and summit-specific CSS structure", which is exactly what shipped.

> **Candidate finding disproved.** Summit's nav omits News, Management and Share structure, and those
> three routes still serve published content (`news-releases` 1, `people` 2, `share-structures` 1) —
> which would be orphaned published content. It is not: every one of the six summit pages links to
> all three from the footer. Verified by scanning rendered HTML for `href="/news"`,
> `href="/management"`, `href="/share-structure"` on each page. No finding.

### Templates are pure presentation

ADR-0017 point 3 requires both templates to reuse the shared published-only read path. They do:

```
$ grep -nE "payload|getPayload|find\(|fetch\(|overrideAccess" src/components/templates/*.tsx
                                  # no results
$ grep -nE "reviewedBy|reviewedAt|publishedAt|contentOrigin|extraction|sourceCheck|websiteDomain|subdomain" src/components/templates/*.tsx
                                  # no results
```

All data reaches both shells through `getPublicHomeData(company)`, which fans out to the
`getPublished*` helpers. Template selection happens in `page.tsx` **after** `requirePublishedTenant()`.

---

## 4. Multi-listing fixture (S6-5) — **closed in code, not observable on Production**

Seed and test are correct. `ensurePrimaryListing` was generalised to `ensureListing` with
`isPrimary`/`displayOrder` parameters, and Veylithra gains a second published listing
(`VYTH` / `OTCQB`, non-primary). The new test in `tests/sprint3-public-api.int.spec.ts` asserts ≥2
published listings, both `isPrimary` values present, and no `tenant` or reviewer keys — it passed in
the 130-test run.

**But the fixture is not on Production:**

| Host | live `/api/company-listings` |
| --- | --- |
| `qelvarion-resource` | 1 — `TSXV:QVRN` primary |
| `zenthoriq-resource` | 1 — `TSXV:ZQRI` primary |
| `veylithra-tungsten` | **1** — `CSE:VYTH` primary (no `OTCQB` row) |

This is expected and correct: Production is not re-seeded, and nobody should run `seed:reset`
against it. Recording it so the handoff is not read as "multi-listing is live". The multi-row public
path is exercised by the integration test against a seeded local database, not by Production traffic.

---

## 5. Document URLs (S6-6) — **seed closed, live partly open**

**Seed: closed.** All five `externalUrl` values are removed from the seeded document creates
(`src/seed/index.ts`, formerly lines 711, 728, 1068, 1343, 1359). Seeded documents now open through
the uploaded-media path.

**Live: the third-party link is gone; one demo link remains.**

| Host | Document | live `externalUrl` |
| --- | --- | --- |
| `qelvarion-resource` | `corporate-presentation-upload` | *(none)* |
| `veylithra-tungsten` | `corporate-presentation-upload` | *(none)* |
| `zenthoriq-resource` | `zenthoriq-isolation-doc` | **`https://example.com/zenthoriq-resource-doc`** |

The `tiiny.site` third-party URL that motivated S6-6 is **no longer served anywhere** — the Veylithra
`corporate-presentation` record is gone from public reads entirely. That was the substantive risk and
it is cleared.

One `example.com` link is still live on `zenthoriq-resource`. Per the brief I am not treating this as
fixable by seed — the value lives in a Production CMS record and seed does not mutate it. **Operator
task on `admin.nrlaunch.com`.** Severity stays Low: `example.com` is IANA-reserved and cannot be
registered by a third party, so unlike the `tiiny.site` link it carries no takeover risk.

---

## 6. Regression — S6-1 / S6-2 / S6-3 all hold

### Live host × path matrix (Production, redirects not followed)

| Host | class | `/` | `/dashboard` unauth | `/api/projects` | `/api/companies` |
| --- | --- | --- | --- | --- | --- |
| `nrlaunch.com` | apex | 200 marketing | 307 → admin | 200 `docs=0` | 200 `docs=0` |
| `www.nrlaunch.com` | www | 307 → apex | 307 → apex | 307 | 307 |
| `admin.nrlaunch.com` | admin | 307 → `/login` | **307 → `/login?next=/dashboard`** | 200 `docs=0` | 200 `docs=0` |
| `demo.nrlaunch.com` | reserved | 404 | 307 → admin | 200 `docs=0` | 200 `docs=0` |
| `typo.nrlaunch.com` | unknown | 404 | 307 → admin | 200 `docs=0` | 200 `docs=0` |
| `qelvarion-resource` | tenant/explorer | 200 | 307 → admin | 200 `docs=2` | 200 `docs=1` |
| `veylithra-tungsten` | tenant/summit | 200 | 307 → admin | 200 `docs=2` | 200 `docs=1` |
| `zenthoriq-resource` | tenant/explorer | 200 | 307 → admin | 200 `docs=1` | 200 `docs=1` |

**Zero 5xx.** Reserved and unknown labels fail closed. S6-3's redirect target still resolves to a
login prompt, not a dead 404.

### Disclosure, isolation and field stripping

Across `projects`, `companies`, `news-releases`, `documents`, `media`, `company-listings`,
`exploration-contents`, `share-structures`, `people`, `catalysts`, `investment-highlights` on all
three tenant hosts:

- **zero** banned keys, checked by walking every key of every returned object (not substring
  matching): `reviewedBy`, `reviewedAt`, `publishedAt`, `tenant`, `websiteDomain`, `subdomain`,
  `templateKey`, `contentOrigin`, `originLockedAt`, `extraction*`, `reviewerSourceCheck*`,
  `sourceCheckAcknowledged`;
- every record `published` (companies `active`) — no Draft, Review or Archived;
- `users` and `tenant-memberships` → **403** on every tenant host;
- rendered HTML on all three tenants clean of draft fixtures and provenance internals — **including
  the new Summit shell**, which is the one genuinely new rendering surface in this commit.

Cross-tenant containment: `qelvarion-resource` → `[greywater-flats, northridge-belt]`,
`zenthoriq-resource` → `[hollowspire-isolation]`, `veylithra-tungsten` → `[fennwick-drift,
hollowspire-ridge]`. No tenant serves another's records.

### Media (S6-2 adjacent) and storage

| Request | Result |
| --- | --- |
| Qelvarion media from own host | 200 `application/pdf` |
| Veylithra media from own host | 200 `application/pdf` |
| Qelvarion media from Veylithra host | **403** |
| Veylithra media from Qelvarion host | **403** |
| Qelvarion media from apex | **403** |
| Direct Supabase object (both public and non-public paths) | **400** |

### importMap (S6-2) — no regression

```
$ npm run generate:importmap
No new imports found, skipping writing import map
$ grep -o S3ClientUploadHandler …/importMap.js | wc -l     → 4
$ git status --porcelain                                    # empty
```

The handoff records this count as **2**; both are correct — `grep -c` counts matching *lines* (2),
while the handler appears **4** times across those lines. The contract (`> 0`, tree clean) holds
either way.

---

## 7. New findings

### N-2 — retired-fixture exemption rule does not cover all evidence filenames (Low)

The class fix is right in shape but the pattern set encodes a narrower naming convention than the
project actually uses. Measured against the shipped guard:

```
docs/SPRINT6_REREVIEW.md        exempt
docs/SPRINT7_REVIEW.md          exempt
docs/SPRINT10_HANDOFF.md        exempt
docs/SPRINT6_REREVIEW2.md       NOT exempt   ← this review's own filename
docs/SPRINT6_REVIEW_FINAL.md    NOT exempt
```

`HISTORICAL_PATH_PATTERNS` requires `SPRINT<digits>_` followed by exactly one of four keywords and
then `.md`. A second re-review in one sprint, or any suffixed variant, re-breaks the gate on commit —
the same late-surfacing failure mode as the original S6-7, just rarer.

**Why Low, not Medium:** `EXTRA_ALLOWLIST` exists as the documented escape hatch, the failure is loud
and immediate, and the third test would still pass. It is a narrowness bug, not a design error.

**Fix:** broaden to something like `^docs/SPRINT\d+_[A-Z0-9_]+\.md$`, or add
`docs/SPRINT6_REREVIEW2.md` to `EXTRA_ALLOWLIST` if this document is committed unredacted. As
written, this document is redacted and does **not** trip the gate — verified: the guard returns exit
0 with this file staged.

### N-3 — `resolveTemplateKey()` can throw inside the not-found boundary (Low)

`5dfa1a1` adds template resolution to the 404 page:

```tsx
// src/app/(frontend)/not-found.tsx
template = resolveTemplateKey(company)      // throws on an unrecognised key
shellClass = templateShellClass(template)
```

and `resolveTemplateKey` throws rather than falling back:

```
$ resolveTemplateKey({ templateKey: 'bogus' })
THROWS: Unknown templateKey: bogus
```

An uncaught throw inside the not-found boundary yields **500 on a path whose job is to return 404** —
structurally the same shape as S6-3, which was a boundary component failing during error rendering.
It also sits awkwardly with ADR-0017 point 4, which requires unknown keys to "fail closed
(404/setup)"; a 500 is not failing closed in the sense that point intends.

**Reachability is genuinely low:** `templateKey` is a Payload enum (`'explorer' | 'summit'`), a
`Companies` hook preserves it on write, and `resolveTemplateKey` handles `null` by returning
`explorer`. Reaching the throw needs a DB value outside the enum — most plausibly a future third
template key added to the schema before `TEMPLATE_KEYS`.

**Not reproduced live.** Demonstrating it requires writing an invalid `templateKey` into Production,
which I will not do. This is a code-reading finding, stated as such.

**Fix:** in `not-found.tsx` (and optionally `page.tsx`), treat an unresolvable key as `explorer` for
shell purposes, or wrap in try/catch — the 404 page should never be the thing that 500s. A test
asserting the not-found path survives an unknown `templateKey` would close it.

### N-4 — handoff table duplicates two rows and leaves a superseded claim in place (Low, docs)

In `docs/SPRINT6_HANDOFF.md`, the post-`93bf908` remediation table lists **S6-5 and S6-6 twice**, with
identical text. Separately, the earlier section still asserts:

> `npm run verify` (corrected): exit **0** … **125** tests / 21 files … `build:ci` executes and exits 0

for the `93bf908` candidate. The prior re-review disproved that (it exits 1 on the committed tree),
and the new section explains why — but the original row is not marked superseded, so a reader
skimming the table sees two contradictory "corrected" claims. Delete the duplicates and annotate the
stale row.

---

## 8. Not verified

1. **`admin.nrlaunch.com/dashboard` with a valid session → 200.** Credentials are operator-held; not
   requested or used. Last verified at `50c2c0f`; **not** re-verified at `5dfa1a1`. The 307 → `/login`
   path is verified, so the unauthenticated half is sound.
2. **N-3 reachability**, per above — would require writing an invalid enum value to a database.
3. **Production bucket privacy.** Direct object requests return `400 Bucket not found`, which proves
   nothing is publicly served under the bucket name `media`; the real `S3_BUCKET` value is
   operator-held and not present locally, so this is carried forward rather than re-proven.
4. **Browser rendering of the Summit shell.** Verified by markup markers and class counts in served
   HTML, not by visual inspection. Layout correctness (as opposed to structural difference) is a
   design judgement outside a defect review.
5. **Whether `5dfa1a1` is byte-for-byte the deployed build.** Inferred from the summit markers, which
   exist only in this commit. There is still no build-SHA endpoint; adding one would remove this
   inference permanently.
6. **Operator gates, unchanged and still open:** ADR-0020 Production backup/restore rehearsal,
   deployed observation of `DATABASE_SSL_CA` / `PAYLOAD_DATABASE_PUSH`, rollback exercise.

---

## 9. Recommendation

**No Critical or High findings remain open.** S6-7 — open across three consecutive candidates — is
closed at the committed-tree layer with bidirectional proof, and `build:ci` executes inside `verify`
for the first time.

Ordered next steps, none blocking:

1. **Operator:** clear the remaining `example.com` `externalUrl` on `zenthoriq-resource`'s
   `zenthoriq-isolation-doc` via `admin.nrlaunch.com`. Closes S6-6 completely.
2. **N-2:** broaden the exemption pattern before writing another same-sprint evidence document.
3. **N-3:** make the 404 path tolerate an unknown `templateKey`.
4. **N-4:** de-duplicate the handoff table, annotate the superseded verify claim.
5. **Operator:** the ADR-0020 gates — restore rehearsal, deployed env observation, rollback exercise.

**On customer content:** no Critical or High blocks it. The remaining gates are the ADR-0020
operator items and the Product Director's sign-off, neither of which is mine to close. Steps 1–4
above are cheap and worth clearing first so the promotion decision is made against a clean board.

---

## 10. Method note

The prior cycle produced Evidence Rule 9 — *verify the artifact you are shipping, not the workspace
you built it in.* This candidate followed it: the handoff records verify as measured **after
`git add -A`**, and that is why its claim reproduces where the previous one did not. The rule worked
within one cycle of being written.

The one thing this pass adds concerns **fixes that are scoped to a route rather than a contract**.
S6-4 could easily have been closed by rewriting the homepage alone, which would have satisfied every
literal word of the finding while leaving summit a colour variant on eight of nine public routes. It
was not — the nav change carries the distinction everywhere. But that could only be established by
requesting *both* templates across *all* routes and comparing, rather than checking the page the fix
was written against. Checking the fixed instance would have confirmed the fix and missed the
question.
