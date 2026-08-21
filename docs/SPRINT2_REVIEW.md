# Sprint 2 Code Review — Defect Report

> Historical terminology note: this document predates the Sprint 6 fixture identity rename. Quoted Aurora Gold/Northern Copper names, poison strings and slugs refer to retired fictional test fixtures and are preserved as historical evidence; they are not current tenants or Production identities.

**Reviewer:** Claude (Opus 5), defect-first review
**Date:** 2026-08-12
**Scope:** Sprint 2 mining content workflows, per `AGENTS.md` and `docs/SPRINT2_HANDOFF.md`
**Environments:** local build + live Vercel Preview `mining-ir-platform-apmjvq9hy-donkimc.vercel.app` and its Supabase Pro project
**Verdict:** ❌ **No-ship for Production promotion** — see [Verdict](#verdict)

---

## How this review was conducted

Read `AGENTS.md`, the Sprint 2 handoff, ADR-0004/0006/0007, and the full Sprint 2 diff; ran the local
suite and a production build; exercised the disclosure gate, tenant isolation and relationship checks
against a running local server; then tested the live Preview deployment and its Supabase backend.

Findings are labelled **Confirmed live** (reproduced against a running environment), **Measured**
(observed in the browser), or **Code-level** (read from source, not reproduced at runtime).

### Test artifacts created and removed

All test data was cleaned up. Local DB is back to seed state; staging `media` is back to 0 documents
and `news-releases` back to its 2 seeded rows.

| Environment | Created | Removed |
| --- | --- | --- |
| Staging | 2 test media uploads, 1 draft news release | ✅ all deleted, verified |
| Local | 2 test news releases, 1 Northern Copper project fixture | ✅ all deleted, verified |

### Baseline verification

| Command | Handoff claim | Observed |
| --- | --- | --- |
| `npm run lint` | Pass | ✅ Pass |
| `npm run typecheck` | Pass | ✅ Pass |
| `npm test` | 37/37 | ✅ Pass — **39/39** (claim stale) |
| `npm run build` | Pass | ✅ Pass |
| `npm run seed:reset` | Pass | ✅ Pass |

---

## Severity summary

| ID | Severity | Area | Title | Status |
| --- | --- | --- | --- | --- |
| [C1](#c1) | 🔴 Critical | public-leak | Supabase `media` bucket is public; uploads bypass all access control | Confirmed live |
| [H1](#h1) | 🟠 High | staging | Live secrets in review packet must be rotated | Confirmed |
| [H2](#h2) | 🟠 High | staging | `push: true` is the fail-open default, including production | Code-level |
| [H3](#h3) | 🟠 High | staging | TLS verification to the database disabled on Preview | Code-level |
| [M1](#m1) | 🟡 Medium | publishing | `disclosureLevel` is stored but drives nothing | Confirmed live |
| [M2](#m2) | 🟡 Medium | tenant | Anonymous API serves all tenants' content + review metadata | Confirmed live |
| [M3](#m3) | 🟡 Medium | staging | Baseline migration cannot apply to an existing database | Code-level |
| [M4](#m4) | 🟡 Medium | UX/a11y | Mobile hero regression now materially worse | Measured |
| [M5](#m5) | 🟡 Medium | other | Uploads had never been exercised until this review | Confirmed live |
| [L1–L8](#low) | 🟢 Low | mixed | See table | Mixed |

---

# 🔴 CRITICAL

## C1
### The Supabase `media` bucket is public. Uploaded files bypass every access control in the app.

**Area:** public-leak · **Evidence:** live staging + `src/collections/Media.ts:35-62`

**What's wrong**

I uploaded a file to staging under a name never previously requested (so no CDN cache could exist),
then fetched it anonymously with a cache-buster:

```
POST /api/media  (as Company Admin)                          → 201
GET  https://<ref>.storage.supabase.co/storage/v1/object/
       public/media/confidential-draft-4163.png?cb=…
       — no cookie, no auth header                            → 200 image/png
```

Payload's `Media.access.read` is irrelevant to the bytes. Anyone with — or guessing — a filename
downloads the file. Objects are stored under their **original upload names**, so
`ni-43-101-technical-report.pdf` is a realistic guess.

**Second, independent gate failure.** The app's own endpoint is not gated by document status either.
`Media.access.read` for anonymous users checks only that the *owning tenant* is published — not that
the file is attached to a **published** Document:

```
GET /api/media/file/confidential-draft-4163.png   (anonymous) → 200
```

So a Draft technical report's PDF is anonymously downloadable through **both** paths, while the
Document record itself correctly 404s on the public site.

**Why it matters**

This is the "public exposure of Draft/Review content" failure mode (Review Focus #3) arriving through
the storage layer, and it is the worst one for this product: an unreleased NI 43-101 or drill result
leaking ahead of publication is selective disclosure. Every other Sprint 2 control — the review gate,
status-only approval, the source requirement — sits in front of a door that is open.

**Fix**

1. Set the Supabase `media` bucket to **private** (`public = false`). *(Supabase dashboard/API — not a
   code change.)*
2. Serve files only through Payload with the access check applied (signed URLs or access-checked
   streaming).
3. Extend `Media.access.read` for anonymous users: require the media to be referenced by a **published**
   Document/Person of a published tenant. Tenant-published is not sufficient.
4. Randomize stored object keys (UUID prefix) so filenames are not guessable.
5. Regression test: anonymous fetch of a draft-attached file must be denied.

**Note on a false lead.** An earlier check appeared to show deleted objects persisting in Storage. That
was a Cloudflare cache hit (`cf-cache-status: BYPASS` on retry); with a cache-buster the object
correctly returns 400, so deletes do propagate. But CDN caching of public objects is itself an argument
for a private bucket — an unpublished file keeps being served from cache after you pull it.

---

# 🟠 HIGH

## H1
### Live secrets in the review packet must be rotated

**Area:** staging · **Evidence:** `docs/SPRINT2_CLAUDE_REVIEW.local.md`

The packet holds the real `DATABASE_URI` (with password), `PAYLOAD_SECRET`, `S3_SECRET_ACCESS_KEY`, and
both staging admin passwords. It is correctly gitignored — but the documented workflow is to paste it
into a chat session, and it has been.

`PAYLOAD_SECRET` signs session JWTs: anyone holding it can forge a valid session for **any** user on
that deployment, including Platform Admin. The database password grants direct Postgres access,
bypassing the application entirely.

**Fix.** Rotate `PAYLOAD_SECRET`, the Supabase database password, and the S3 keys; reset both staging
passwords. Change the packet to reference a password-manager entry instead of embedding values — the
handoff's own note ("rotate any token or secret that was pasted into chat") should be the default
workflow, not a footnote.

## H2
### `push: true` is the fail-open default, including in production

**Area:** staging · **Evidence:** `src/payload.config.ts:76`

```ts
push: process.env.PAYLOAD_DATABASE_PUSH !== 'false',
```

A **missing** variable means push is on. Preview sets it correctly today, but on Production promotion a
forgotten env var lets Payload silently alter the live schema at boot — precisely what ADR-0007 and the
handoff's own deployment task ("Replace local-only `push: true` behavior") set out to prevent.

**Fix.** Invert the default — opt **in** via `PAYLOAD_DATABASE_PUSH === 'true'` — and hard-fail at boot
if push is enabled while `NODE_ENV === 'production'`.

## H3
### TLS verification to the database is disabled on Preview

**Area:** staging · **Evidence:** `src/payload.config.ts:71-73`, Preview env `DATABASE_SSL_REJECT_UNAUTHORIZED=false`

The connection is encrypted but unauthenticated: a MITM between Vercel and Supabase can present any
certificate and read or alter all traffic, credentials included.

**Fix.** Supabase publishes a CA certificate — pin it (`ssl: { ca }`) rather than disabling
verification. If it must remain temporarily, scope it to Preview only, record it in ADR-0007 as a known
risk, and never carry it to Production.

---

# 🟡 MEDIUM

## M1
### `disclosureLevel` is stored, edited and displayed, but nothing branches on it

**Area:** publishing · **Evidence:** `src/lib/constants.ts:31`, `src/lib/fields.ts:56-68`, `src/lib/collection-hooks.ts:70`

Every reference to `disclosureLevel` is schema, form, action or seed. No code path reads its value.
Source requirements come from a static per-collection `requireSource` flag instead.

Consequences: a **People** record (`requireSource: false`, `src/collections/People.ts:23`) marked
`disclosureLevel: 'technical'` — a QP's credentials in a biography, say — needs no source at all, while
a **Document** marked `'none'` still demands one. The field that classifies disclosure sensitivity has
no effect on the disclosure controls.

It can also be silently downgraded after publication — confirmed live:

```
PATCH /api/news-releases/29 {"disclosureLevel":"standard"}   on a published record → OK
```

**Fix.** Drive `requireSource` from `disclosureLevel === 'technical'` (OR the collection default), and
add `disclosureLevel` to each disclosure-field list so it cannot be changed post-publish without review.

## M2
### The anonymous API serves every tenant's published content, plus review metadata

**Area:** tenant / public-leak · **Evidence:** live, `src/lib/collection-hooks.ts:51-60`, `src/lib/public-data.ts:14-19`

```
GET /api/news-releases          (anonymous, on Aurora's host)
→ northern-isolation-release (tenant 2), north-ridge-drill-program (tenant 1)
```

Same for `documents`. Every record also exposes `reviewedBy` (internal user id), `reviewedAt` and
`publishedAt` — which `omitReviewFields` strips from server-rendered pages but not from REST/GraphQL on
the same origin.

The handoff's "Cross-tenant leak on public pages | **Pass**" is accurate for HTML only; the claim reads
broader than what was tested.

*Confirmed not leaking:* relations do **not** expand for anonymous callers — `reviewedBy` stays an
integer even at `depth=2`, so no user emails or session IDs escape.

**Fix.** Add the resolved tenant to the anonymous read filter, and strip review metadata at the
collection level (`afterRead`) rather than in a single read helper.

## M3
### The migration is a single baseline that cannot be applied to an existing database

**Area:** staging · **Evidence:** `src/migrations/20260812_061650_sprint2_content.ts`

It issues `CREATE TYPE`/`CREATE TABLE` for **all** Sprint 1 + Sprint 2 objects, and its `down()` drops
every table. That worked because staging was empty. It will fail against any database already carrying
Sprint 1 schema — which is the Production promotion path the handoff defers to.

**Fix.** Before promoting, generate a genuine incremental migration against a Sprint 1-shaped database
and test it there.

## M4
### The mobile hero regression is now materially worse

**Area:** UX/a11y · **Evidence:** `src/app/(frontend)/page.tsx` (`min-h-[calc(100svh-5.5rem)]`), measured at 375×812

Sprint 2 added four nav items to a layout that still hard-codes an 88px header assumption:

| | header | hero | viewport | `<h1>` top |
| --- | --- | --- | --- | --- |
| Sprint 1 original | 162px | 886px | 812px | 620px |
| After Sprint 1 fixes | 170px | 894px | 812px | 620px |
| **Now** | **206px** | **930px** | 812px | **656px** |

At 375px the nav wraps to three rows and roughly 450px of empty green sits between the Login button and
the company name — the entire first viewport is chrome and void. Every nav item added from here makes it
worse.

**Fix.** Drop the magic `5.5rem`: make the hero a flex column with the header as a sibling
(`min-h-[100svh]` on the wrapper, `flex-1` on the content), and collapse the nav to a menu below `md`.

## M5
### Uploads had never been exercised until this review

**Area:** other · **Evidence:** `media` count 0 locally and on staging; no upload test; all seeded Documents use `externalUrl`

The staging table lists Storage as **Pass** and the pre-review checklist says "Media/document links work
after a new deployment," but nothing had passed through it. The integration does work — `s3Storage` is
genuinely active and files land in Supabase — but it went unverified until this review, and testing it
is what surfaced [C1](#c1).

**Fix.** Seed at least one Document backed by an uploaded file, and add an integration test for
upload → fetch → access-denied-when-draft.

---

# 🟢 LOW

<a name="low"></a>

| # | Evidence | Issue | Fix |
| --- | --- | --- | --- |
| L1 | `git status` — 61 changed/untracked files | All of Sprint 2 is uncommitted: no commit boundary, no revert point, nothing bisectable. | Commit in reviewable slices. |
| L2 | Handoff line 27 | Claims 37 tests; actual is 39. Same staleness class as Sprint 1's "22/22". | Record observed numbers. |
| L3 | `dashboard/news/actions.ts:22-27` | `Number(trimmed)` for project ids reintroduces the numeric-PK assumption fixed as Sprint 1 L3; repeated in the other action modules. | Pass ids through unchanged. |
| L4 | response headers, `next.config.ts` | No CSP, `X-Frame-Options` or `X-Content-Type-Options` on a public investor site. HSTS present (Vercel default). | Add a `headers()` block. |
| L5 | `/share-structure` at 375px | Footer links and "View source document" measure ~20px — under WCAG 2.2 AA 2.5.8 (24px). Nav was fixed in Sprint 1; these were not. | Pad to ≥24px. |
| L6 | `SiteHeader.tsx:7-13` | `/investors` and `/corporate` still exist as routes but were dropped from the nav — reachable but unlinked. | Link them or remove the routes. |
| L7 | `publishing.ts:239-244` | `assertSameTenantRelation` lets Payload's NotFound escape for a non-existent related id → 404 instead of a validation error. | Catch and raise the same tenant-mismatch `APIError`. |
| L8 | seed fixtures | Northern Copper has news + documents but **no project**, so the cross-tenant `project` relation check has no fixture. | Add a Northern Copper project to the seed. |

---

# Verified OK

Live-tested unless marked *(code)*.

## Disclosure gate — the core Sprint 2 deliverable, and it holds

Full battery against a real news release:

| Attempt | Result |
| --- | --- |
| draft → published | ✅ rejected |
| draft → review (no source) | ✅ rejected — source required |
| draft → review (with source) | ✅ allowed |
| review → published **+ body change** | ✅ rejected — "Approval must be a status-only action" |
| review → published, forged `reviewedBy:1`, `reviewedAt:2020` | ✅ allowed, forgery **ignored** — server stamped the real session user |
| forged review metadata on **create** | ✅ stripped |
| published → edit `body` / `title` | ✅ rejected |
| published → non-disclosure edit | ✅ allowed (no false positive) |

## Tenant isolation across all five new collections

Cross-tenant read → `Not Found`; patch, create-in-other-tenant → 403; dashboard page → 404.
Cross-tenant **relationship assignment** rejected for both `project` ("Related project must belong to
the same tenant") and `sourceDocument`; same-tenant assignment allowed.

## Published-only public reads

`/news/draft-financing-placeholder` → 404; `/news/northern-isolation-release` (other tenant) → 404.
No draft rows in any anonymous API response, local or staging.

## Staging is genuinely staging

Preview serves from Supabase (IDs differ from local), no `localhost` strings in any served page, `/cms`
renders only the login shell with no data. The remote write path works end to end and the disclosure
gate is enforced there too (draft → published rejected on Preview).

## Tenant header spoofing stays fixed in production

`x-tenant-slug: northern-copper` against the Preview does not switch tenant. The `*.vercel.app` fix
(`isPlatformDeploymentHost`, `src/lib/tenant.ts:15-23`) works.

## Source affordances

News detail renders a "Source" heading with an external link; project detail shows
"Technical summary (sources)" → "Source documents" → exploration content, with the Sprint 1 M5 fix
intact.

## Public pages structurally sound

Zero horizontal overflow at 375px on all five new routes; one `<h1>` each, clean heading order,
`<main>` and skip link present, per-tenant titles (`News · Aurora Gold`).

## Sprint 1 regressions

None found. Projects, company profile, publish flow, Platform Admin separation and the `use-server`
export guard all still behave.

---

# Verdict

<a name="verdict"></a>

**No-ship for Production promotion.**

[C1](#c1) alone is disqualifying. For a product whose value proposition is *controlled* mining
disclosure, shipping with a world-readable media bucket means the review gate is decorative for the one
content type — technical reports — that most needs it.

### Must fix before promoting

| # | Why it blocks |
| --- | --- |
| **C1** | Unpublished technical documents are anonymously downloadable at guessable URLs. Selective-disclosure exposure. |
| **H2** | Fail-open schema push turns one forgotten env var into a silent production schema change. |
| **H1** | Live `PAYLOAD_SECRET` can forge any session, including Platform Admin. Rotation is a human task, not a code change. |
| **H3** | Unauthenticated TLS to the database; must not reach Production. |

### Sprint 3 backlog

M1–M5 and the Low table. M4 is worth pulling forward — it degrades with every nav item added.

### Pattern worth naming

Sprint 1's blockers slipped through because lint, typecheck and tests were green while the app was
broken. Sprint 2's Critical is the same shape one layer down: 39 green tests, a passing build, a Preview
smoke returning all 200s — and the one thing none of them touched was the one thing that was open.
The `media` count of 0 in both environments was the tell.

**The strongest work in this project so far is the disclosure engine itself.** The gate is coherent, the
forged-metadata strip works, cross-tenant relations are checked, and it all holds remotely. Every
failure here is at the **infrastructure seam** — storage, secrets, schema push, TLS — which is exactly
where Sprint 2's new surface was, and exactly what a local test suite cannot see.
