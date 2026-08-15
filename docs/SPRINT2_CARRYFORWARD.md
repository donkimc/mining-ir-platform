# Sprint 2 — Review Sign-off and Carry-Forward

**Reviewer:** Claude (Opus 5)
**Final pass:** 2026-08-15 (third-pass re-review)
**Review chain:** [`SPRINT2_REVIEW.md`](./SPRINT2_REVIEW.md) → [`SPRINT2_REREVIEW.md`](./SPRINT2_REREVIEW.md) → this document
**Code verdict:** ✅ **Ready** — all code findings closed and verified
**Promotion verdict:** ⚠️ **Conditional** — four owner actions remain, one of them a live Critical exposure

---

## 1. Sign-off summary

Every code-side finding raised across three review passes is closed and verified against a running
system. No Critical, High or Medium defects remain in the code.

| Pass | Findings raised | Status now |
| --- | --- | --- |
| Review 1 | C1, H1, H2, H3, M1–M5, L1–L8 | Code items all fixed; H1/M3 + C1 bucket are owner actions |
| Re-review 2 | N1, N2, N3, N4 | N1, N2 fixed; N3, N4 open (Low) |
| Re-review 3 | L-a, L-b | Open (Low) |

**Verification at final pass:** `npm run verify` green — lint, typecheck, **57/57 tests**, migration-drift
check, `build:ci`. Live checks passed on `https://mining-ir-platform.vercel.app` and on a local server.

### What is proven to work

- **Disclosure gate (ADR-0004).** Draft→Published rejected; approval is status-only (content changes in
  the same request rejected); published disclosure fields locked; `reviewedBy`/`reviewedAt`/
  `publishedAt` server-derived and client forgery stripped. Verified locally and on staging.
- **Tenant isolation.** Cross-tenant read → `Not Found`, write → 403, create-in-other-tenant → 403,
  dashboard page → 404, cross-tenant relationship assignment rejected.
- **Anonymous public reads.** All nine publishable collections scoped to the resolved tenant with review
  metadata stripped. Proven with a real cross-tenant fixture (`NORTHERN SECRET`, tenant 2) that exists
  in the database and appears in neither the API nor the HTML.
- **Media access (C1 app-side).** Draft-attached file → **403**; published-attached → **200**;
  UUID-prefixed object keys; no Supabase public URLs emitted anywhere.
- **Deployment guards.** `PAYLOAD_DATABASE_PUSH=true` + `NODE_ENV=production` throws in **all** phases
  including the Next build; build forces `push:false`; insecure TLS blocked in production except via the
  documented, expiring hatch.
- **Migration drift CI.** Proven to fail on injected drift, not merely present.
- **Session.** Login persists across dashboard and admin navigation; role separation intact;
  unauthenticated redirects intact; cookie `Secure; HttpOnly; SameSite=Lax` on HTTPS.

---

## 2. Owner actions — must close before Production

These are infrastructure/credential tasks. None can be done from the repo.

| # | Action | Why it blocks | Verify by |
| --- | --- | --- | --- |
| **1** | Set the Supabase `media` bucket to **`public = false`** | 🔴 **Critical.** Previously proven: an anonymous request to `…/storage/v1/object/public/media/<file>` returned 200. The app-side gate is solid but governs only Payload's route — a public bucket bypasses it entirely. An unpublished technical report is a selective-disclosure exposure. | Upload a draft-attached file, then fetch the direct Supabase object URL anonymously with a cache-buster. Must not return 200. |
| **2** | Rotate `PAYLOAD_SECRET`, Supabase DB password, S3 keys, both staging admin passwords | `PAYLOAD_SECRET` signs session JWTs — anyone holding it can forge a session for any user, including Platform Admin. These values were pasted into chat sessions. | Old staging credentials stop working. |
| **3** | Set `DATABASE_SSL_CA` on Preview/Production; remove `ALLOW_INSECURE_DB_SSL` | Currently running with TLS verification disabled to the database. Fenced and documented (ADR-0007, **expiry 2026-09-30**) but unauthenticated transport to the DB. | Deploy without `ALLOW_INSECURE_DB_SSL`; app boots. |
| **4** | Generate and test an **incremental** migration against a Sprint 1-shaped database | The baseline migration assumes an empty DB; it will fail against any database already carrying Sprint 1 schema. | Apply to a restored copy of the target DB, not an empty one. |

### Also do — 5 minutes, closes the last verification gap

**Seed one uploaded-document fixture into staging.** Staging `media` has been empty for all three review
passes, which is the only reason C1 could never be confirmed in the cloud. With one draft-attached and
one published-attached file present, owner action #1 becomes a two-command check.

**Commit the working tree.** 34 files were uncommitted at final review, including all of the remediation
work. Commit before promoting so the deployed build has a traceable ref.

---

## 3. Open Low findings — carry to Sprint 3

None of these compound; none block promotion.

| ID | Evidence | Issue |
| --- | --- | --- |
| **N3** | `src/lib/publishing.ts:273-276` | The L7 mapping is inert: Payload's `NotFound` extends `APIError`, so the catch rethrows it unchanged and a bad relation id still returns a bare `Not Found`. Narrow to `error.status === 400` or use a sentinel. |
| **N4** | `src/collections/Media.ts:29-94` | Anonymous media reads run three queries at `limit: 1000` and materialise an id set. Past 1000 published documents/people, media access silently drops — presents as randomly broken images. Use a join/subquery. |
| **L-a** | `src/components/FullPageNavLink.tsx:9-13` | Comment blames Next `<Link>` soft navigation for dropping cookies; that is not a Next behavior. The real cause was Secure-cookie-on-HTTP, fixed in `auth-cookies.ts`. The component costs client-side routing across the whole authenticated shell for a cause likely already fixed. Retry one `<Link>` on HTTPS staging; if the session holds, remove it and fix the comment. |
| **L-b** | `src/lib/auth-cookies.ts:20-21` | Auth cookie falls back to non-`Secure` when both `x-forwarded-proto` and `NEXT_PUBLIC_SERVER_URL` are absent. Unreachable on Vercel, but a fail-open default in auth code. Fail secure in production. |
| **L5 residual** | footer `mailto:` | Still 20px — the only sub-24px tap target left (WCAG 2.2 AA 2.5.8). |
| **M2 (docs)** | `SPRINT2_HANDOFF.md` | Known limitation: `investment-highlights` / `catalysts` can still be created directly as Published (Sprint 1 homepage helpers). Never in scope for Sprint 2; decide in Sprint 3. |

---

## 4. Standing guidance for Sprint 3

Three review rounds produced the same failure shape each time. These are worth adopting as working
agreements rather than re-discovering.

**1. Fix the class, not the instance.** Every round, a remediation landed on the named file and stopped
at the boundary of the sprint rather than the boundary of the defect. M2 scoped the five collections
Sprint 2 created and left the four from Sprint 1 leaking. L7's catch block reads correct and is inert.
After each fix, ask: *what else has this shape?*

**2. A green suite is not evidence the app runs.** Sprint 1's blockers shipped with lint, typecheck and
22 passing tests all green while the app could not build. Sprint 2's Critical shipped with 39 green
tests and a Preview returning 200s. The C1 remediation itself shipped a schema change with no migration
and broke staging while `npm run verify` stayed green. `npm run verify` now includes `build:ci` and the
drift check — keep both, and treat "verified" as meaning *exercised in a deployed environment*.

**3. Absent fixtures hide defects.** `investment-highlights` looked clean for a whole round because
Northern Copper had none seeded. `media` was empty for three rounds, which is why C1 was never confirmed
in the cloud. **For every isolation or access rule, seed the negative case** — the record that must
*not* appear.

**4. Verify the staging URL before trusting staging results.** One full review pass produced false
"blocked" results because the handoff recorded an immutable deployment URL serving a stale build. The
stable alias is `https://mining-ir-platform.vercel.app`.

---

## 5. Recommendation

**The code is ready.** Close the four owner actions, seed one media fixture into staging, re-run the C1
bucket check there, commit, and promote. Sprint 3 can start in parallel with the owner actions — none of
them touch application code.
