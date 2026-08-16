# Sprint 3 Review — Production Hardening

**Reviewer:** Claude (Opus 5), defect-first independent review
**Reviewed:** 2026-08-16 · release candidate `9617c16` (hardening `e209229`, evidence `0476ac4`)
**Environments:** `https://mining-ir-platform.vercel.app` (Vercel Production alias, Supabase staging project `jthotkkremiesvocfsmr`) + local
**Verdict:** ✅ **Ship** — no Critical or High findings remain

---

## Verdict

Sprint 3 set out to close the release-blocking infrastructure and credential gaps from the Sprint 2
review. **All eight gates are closed and independently verified.**

The review initially returned **no-ship** on one High finding (H-1, unrotated credentials). The owner
completed the rotations on 2026-08-16 and **H-1 was re-verified closed the same day**. The blocking
condition in ADR-0008 and the handoff review contract — *"do not recommend Production promotion while a
Critical or High finding remains open"* — is satisfied.

This was the strongest of the four review passes on this project. Claims that earlier rounds inflated
were, this time, backed by evidence that survived independent probing.

---

## Sprint 3 gate status

| # | Gate | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Private storage; direct-object denial; app route allows Published, denies Draft | ✅ **Fixed** | Published-attached `200` (81 bytes, `application/pdf`); Draft-attached `403`; direct Supabase public object `400 Bucket not found`, no bytes, on both host forms. **Beyond the claim:** media access follows document status through transitions — published `200` → review `403` → archived `403` |
| 2 | `PAYLOAD_SECRET` rotated; old sessions invalid | ✅ **Fixed** | Independently proven: a JWT forged with the previously exposed secret returns `user: null`; `/admin/tenants` → 307 |
| 3 | Verified DB TLS; insecure hatch removed | ✅ **Fixed** | `src/lib/database-guards.ts:42-69`. Matrix: Vercel + no CA → THROW; `REJECT_UNAUTHORIZED=false` → THROW; legacy `ALLOW_INSECURE_DB_SSL=true` → **ignored, still THROW**; CA → `rejectUnauthorized: true`; local dev unaffected |
| 4 | Incremental migration rehearsal + drift CI | ✅ **Fixed** | Rehearsal PASS on a disposable database: Sprint 2 baseline → column absent → upgrade → present → down → absent → forward recovery. Script refuses production-looking URIs. Drift CI in `npm run verify`, previously proven to fail on injected drift |
| 5 | Real fictional Aurora uploads on cloud staging | ✅ **Fixed** | media id 3 (published-attached), id 4 (draft-only); UUID-prefixed object keys; `originalFilename` retained for display |
| 6 | Public API serializer strips review metadata | ✅ **Fixed** (see L-1) | Zero `reviewedBy` / `reviewedAt` / `publishedAt` across all ten collections anonymously |
| 7 | Production push guards fail closed + ops runbook | ✅ **Fixed** | `VERCEL_ENV=preview\|production` and `VERCEL=1` all throw on `push=true`; build phase forces `push:false`; `docs/OPERATIONS.md` covers rotation, TLS, migrations, backup/restore, rollback, storage recovery, incident response |
| 8 | CMS blank-page regression (`9617c16`) | ✅ **Fixed** | Browser-verified: Payload login UI renders; post-login `/cms/collections/media` lists both files; no console errors |
| — | Credential rotation (H-1) | ✅ **Closed 2026-08-16** | See below |
| — | Tenant isolation / disclosure gates (no regression) | ✅ **Holds** | Full battery green on staging and locally |
| — | Supabase PITR / restore-UI rehearsal | ⚠️ **Not verified** | L-3 — self-declared open |

---

## H-1 — Credential rotation (was High; **closed**)

**Original finding.** The Sprint 2 review-packet passwords for `admin@auroragold.staging` and
`platform@mining-ir.staging` still authenticated successfully; the handoff self-declared the Supabase
database password and S3 keys as unrotated. Those values existed in four chat transcripts and three
gitignored files on disk.

**Closure verification (2026-08-16), all six checks passed:**

| Check | Result |
| --- | --- |
| Old Company Admin password | **401** "The email or password provided is incorrect." |
| Old Platform Admin password | **401** |
| Database password rotated + deployed | All 9 public routes + `/api/projects` → **200** (build connects, so Production `DATABASE_URI` is correct) |
| S3 keys rotated + deployed | Published-attached media → **200, 81 bytes** — byte-identical to the pre-rotation reading, proving the new key reaches storage |
| Security posture after rotation | Draft-attached still `403`; direct Supabase object still `400`, no bytes; all 8 collections tenant-scoped, zero review metadata; no Northern in public HTML; draft slug `404`; unauthenticated `/dashboard` `307`; 4/4 security headers |
| Review packets destroyed | No `*.local.md` on disk; 0 secret-bearing files tracked; repo clean |

**Severity note.** During remediation it was established that Production and staging are **separate
Supabase projects** (`bwftfsfbiyzgwztwtqmh` vs `jthotkkremiesvocfsmr`). The exposed credentials were
always staging-only and never touched customer data. This was an open question at review time; it is now
answered and it reduces the historical blast radius.

---

## Open findings — carry to Sprint 4

### 🟡 M-1 — `/api/companies` serves every tenant's profile to anonymous callers
**Area:** tenant / public-leak · **Evidence:** anon `GET /api/companies?limit=10&depth=0` on Aurora's host

```
id 2  northern-copper : legalName "Northern Copper Corp.", tickerSymbol NCU,
                        shortDescription, templateKey, publicationStatus
id 1  aurora-gold     : + irContactName/Email/Phone, officeAddress,
                        websiteDomain, subdomain, templateKey
```

Every other tenant-owned collection is correctly scoped. `companies` is the sole exemption. A
competitor's legal name, ticker and description are served from Aurora's own API origin — the same class
of exposure N1 closed everywhere else. `websiteDomain`, `subdomain` and `templateKey` are platform
routing configuration, not investor content, and are exposed for every tenant. The public site is
unaffected: it resolves a single tenant server-side with `overrideAccess`, so the anonymous listing
serves no product purpose.

**Fix.** Scope the anonymous `companies` read to the resolved tenant via
`publishedOnlyOrTenantScopedRead()`, and add `websiteDomain`, `subdomain`, `templateKey` to the
anonymous strip list. Platform Admin cross-tenant listing is unaffected.

**Priority:** first week of Sprint 4. It is a contained change and the last inconsistency in an otherwise
clean tenant-isolation model.

### 🟢 L-1 — Public serializer is narrower than the sprint's own specification
`src/lib/collection-hooks.ts:93-106` strips exactly `reviewedBy`, `reviewedAt`, `publishedAt`. Handoff
item 7 also specifies "tenant IDs where not intentionally public"; internal `tenant` ids still appear on
every anonymous document. Either strip them or amend the spec — don't leave code and spec disagreeing.

### 🟢 L-2 — Staging lacks Northern Copper fixtures for three collections
No Northern projects, investment-highlights or catalysts exist on staging, so anonymous cross-tenant
checks for those pass **trivially** there. Verified properly on a local database carrying a deliberate
`NORTHERN SECRET` poison record. Third consecutive sprint with this gap. An isolation test with no
negative case proves nothing.

### 🟢 L-3 — Supabase PITR / restore-UI rehearsal not verified
`docs/OPERATIONS.md:51-65` documents the procedure; the dashboard rehearsal has not been performed. The
migration down/up forward-recovery path *is* genuinely exercised. Do one rehearsal before real customer
content exists, not after.

### Carried from Sprint 2 (unchanged, optional)
- **N3** — `src/lib/publishing.ts:273-276`: the L7 mapping is inert because Payload's `NotFound` extends
  `APIError`, so a bad relation id still returns a bare `Not Found`.
- **N4** — `src/collections/Media.ts:29-94`: anonymous media reads run three queries at `limit: 1000` and
  materialise an id set; past 1000 published documents/people, media access silently drops.

---

## Verified live vs code-only

**Verified live on staging** (`mining-ir-platform.vercel.app`; evidence Preview `k7cj2xhsr`
cross-checked — identical data): published/draft media routes; direct Supabase object denial on both
host forms; API `url` fields are Payload paths only; all ten collections' anonymous scoping and
metadata stripping; `/api/companies` field inventory; CMS login UI and post-login media list in a real
browser; 8 dashboard + 3 admin routes under real sessions; role separation; unauthenticated redirects;
full disclosure-gate battery (forged metadata stripped, draft→published rejected, approval+content
rejected, status-only approval accepted, published edit rejected); 10 public routes; zero Northern in
public HTML; draft news 404; 4/4 security headers; no `localhost` or `storage.supabase.co` strings;
old-secret JWT rejected; **and the full H-1 closure battery**.

**Verified live on local server** (what staging could not prove): cross-tenant relation rejection; the
`NORTHERN SECRET` poison-fixture isolation proof; media access following document status through
review and archived; `npm run verify` — lint, typecheck, **70/70 tests** across 10 files,
migration-drift, `build:ci`; the incremental migration rehearsal; the full TLS/push guard matrix.

**Code-only:** `docs/OPERATIONS.md` runbook accuracy; ADR-0007/0008 wording; the storage-privacy
script's misconfiguration exit paths.

**Could not verify:** Supabase PITR restore (L-3).

---

## Before pointing at the real Production database

Nothing was promoted during this review. `mining-ir-platform.vercel.app` remains backed by the Supabase
**staging** project, which keeps the review evidence valid. When wiring up `bwftfsfbiyzgwztwtqmh`:

1. It has **no schema** — run `npm run migrate`, never `push`. The guards will refuse push there, which
   is intended.
2. Set `DATABASE_SSL_CA` for that project — the CA is per-project.
3. Confirm `PAYLOAD_DATABASE_PUSH` is `false` or absent for Production.
4. **Never run `seed:reset`** against it. That command is destructive and now one env var away from real
   data.
5. Rehearse the restore (L-3) *before* real customer content exists.
6. Vercel environment variables are **per-environment**. A variable set only for Preview will not reach
   a Production build — this cost a full debugging cycle during H-1 remediation. Prefer scoping one
   variable to all environments over maintaining separate copies.

---

## Observation

Four review rounds, and the thing that finally blocked promotion was a password field rather than a line
of code. That is a reasonable place for a project to end up.

The pattern across all four rounds is worth carrying into Sprint 4: **remediation quality was high where
a finding named a file, and thinner where a finding implied a class of problem.** M2 scoped the
collections Sprint 2 created and stopped; M-1 above is the last surviving instance of exactly that
shape. After each fix, ask *what else has this shape?*

The second pattern: **a green suite is not evidence the app runs.** Sprint 1 shipped blockers with 22
green tests and a broken build; Sprint 2 shipped a Critical with 39 green tests and a Preview returning
200s. Sprint 3's `npm run verify` now includes `build:ci`, migration-drift and cloud evidence
requirements — that closes the specific hole, and ADR-0008's Evidence Standard names the general one.
Keep both.
