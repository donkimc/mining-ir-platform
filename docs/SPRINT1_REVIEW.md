# Sprint 1 Code Review — Defect Report

**Reviewer:** Claude (Opus 5), defect-first review
**Date:** 2026-08-11
**Scope:** Sprint 1 vertical slice, per `AGENTS.md` and `docs/SPRINT1_HANDOFF.md`
**Verdict:** ❌ **Not ready to mark Done** — 4 blockers (see [Verdict](#verdict))

---

## How this review was conducted

Read the full contract docs and the complete `src/` tree, then ran the app against the seeded local
Postgres DB (`mining_ir`) on `http://localhost:3001` and probed the running system with `curl`, a
headless browser at 375×812, and direct SQL. The repo was left unchanged and seed data was restored.

Findings are labelled **Confirmed live** (reproduced against the running app), **Measured**
(observed in the browser), or **Code-level** (read from source, not reproduced at runtime).

### Baseline verification

| Command | Result |
| --- | --- |
| `npm run lint` | ✅ Pass |
| `npm run typecheck` | ✅ Pass |
| `npm test` | ✅ **11/11 pass** |

The handoff's recorded results reproduce exactly.

---

## Severity summary

| ID | Severity | Title | Status |
| --- | --- | --- | --- |
| [C1](#c1) | 🔴 Critical | Published technical disclosure rewritable with no review; audit trail falsely attests | Confirmed live |
| [H1](#h1) | 🟠 High | Tenant selected by unauthenticated client-supplied header | Confirmed live |
| [H2](#h2) | 🟠 High | `Why Aurora Gold` hard-coded on every tenant's homepage | Confirmed live |
| [H3](#h3) | 🟠 High | `users.status = 'disabled'` does not block auth or dashboard access | Confirmed live |
| [H4](#h4) | 🟠 High | Media collection not tenant-scoped; writable by any authenticated user | Code-level |
| [M1](#m1) | 🟡 Medium | Access-control layer inert on every application code path | Code-level |
| [M2](#m2) | 🟡 Medium | Multi-tenant users get a non-deterministic tenant, no switcher | Code-level |
| [M3](#m3) | 🟡 Medium | Placeholder public pages ship no title/description; leak platform branding | Confirmed live |
| [M4](#m4) | 🟡 Medium | Mobile hero pushes all content below the fold | Measured |
| [M5](#m5) | 🟡 Medium | Source links ~1.5 screens from the technical claims they source | Measured |
| [M6](#m6) | 🟡 Medium | Integration tests re-implement the code under test | Code-level |
| [L1–L10](#low) | 🟢 Low | See table | Mixed |

---

# 🔴 CRITICAL

## C1
### Published technical disclosure can be rewritten with no review, and the audit trail falsely attests it was reviewed

**Files:** `src/lib/publishing.ts:7-27` · `src/collections/Projects.ts:73-87` · `src/collections/Companies.ts:43-57`

**What's wrong**

The review gate is a **status-transition** guard only. `assertPublicationTransition` returns clean for
`published → published` (line 24), and `applyReviewMetadata` (lines 37-46) only stamps
`reviewedBy` / `reviewedAt` on the `review → published` edge. Nothing re-gates a *content* change to an
already-Published record.

**Confirmed live** — as the seeded Company Admin against the published flagship project:

```
PATCH /api/projects/1  {"technicalSummary":"UNREVIEWED MATERIAL CLAIM: 45 g/t Au over 30m."}
→ 200  status=published  reviewedAt=2026-08-11T11:51:53.715Z  (unchanged, stale)

GET /projects/north-ridge
→ "UNREVIEWED MATERIAL CLAIM: 45 g/t Au over 30m."   ← live to investors
```

The same hole exists on the approval edge itself: a `review → published` submit carries whatever
`technicalSummary` is in that same request body
(`src/app/(frontend)/dashboard/projects/actions.ts:160-192` sends status and content together), so the
"approval" transaction can approve text the reviewer never saw.

**Why it matters**

This is the entire promise of ADR-0004 and `SECURITY.md` §Disclosure Review. For a mining IR product,
`technicalSummary` is exactly the field carrying material grade/intercept claims that securities
disclosure rules exist to govern. Worse than "no gate": `reviewedBy` / `reviewedAt` render as a valid
attestation for content that was never reviewed — an affirmatively misleading record.

**Suggested fix**

Make the gate content-aware, not status-aware:

1. Define a disclosure-sensitive field set — Projects: `technicalSummary`, `highlights`, `summary`,
   `ownershipPercent`, `sourceLinks`; Companies: `investmentThesis`, `longDescription`.
2. In the `beforeChange` hooks, if the record is Published and any of those fields differ from
   `originalDoc`, either force `status` back to `review` and clear `reviewedBy` / `reviewedAt`, or
   reject the write outright.
3. On the `review → published` edge, reject any request that also changes a disclosure field.
   Approval must be a status-only mutation against content already at rest.
4. Split the dashboard form: a "Save changes" action (content, never touches status) and a distinct
   "Submit for review" / "Approve & publish" action (status only).

---

# 🟠 HIGH

## H1
### Tenant is selected by an unauthenticated, client-supplied request header

**File:** `src/lib/tenant.ts:13-36` (header read at `:14-16`)

**What's wrong**

`resolveTenantSlug()` takes `x-tenant-slug` from the raw request with no trusted-proxy check, and it
wins over the hostname.

**Confirmed live:**

```bash
curl -H 'x-tenant-slug: northern-copper' http://localhost:3001/
# → <title>Northern Copper</title>
```

**Why it matters**

Directly contradicts `AGENTS.md:92` ("Never trust a tenant ID supplied only by the browser") and
ADR-0005's "Company Admins never trust browser-supplied tenant IDs." Only Published data is reachable,
so this is **not** a draft leak — but in production any visitor, crawler, or URL-keyed CDN cache can
serve tenant B's investor content under tenant A's domain. For an IR product that is a brand, SEO, and
arguably disclosure problem.

**Suggested fix**

Accept the header only when the request arrives from a trusted proxy (shared secret header) or only
when `NODE_ENV !== 'production'`. Resolve production tenants from `websiteDomain` / `subdomain` against
the `companies` table. The one-line `NODE_ENV` guard is sufficient for Sprint 1 and keeps the local demo
working.

---

## H2
### `Why Aurora Gold` is hard-coded on every tenant's public homepage

**File:** `src/app/(frontend)/page.tsx:61`

```tsx
<h2 className="display mt-3 text-4xl md:text-5xl">Why Aurora Gold</h2>
```

**Confirmed live** — Northern Copper's homepage renders `<title>Northern Copper</title>` above a
section headed **"Why Aurora Gold"**.

**Why it matters**

Review priority #4 and a violation of `AGENTS.md:79` / ADR-0001 ("Aurora Gold may be hard-coded only as
seed/demo data"). Tenant #2 ships with a competitor's name on its investment-thesis section.

**Suggested fix**

`Why {company.displayName}`.

The only other non-seed occurrence, `src/app/(frontend)/admin/tenants/page.tsx:20`, is Platform-Admin-only
descriptive copy and is fine as-is.

---

## H3
### `users.status = 'disabled'` does not block authentication or dashboard access

**Files:** `src/collections/Users.ts:11` (`auth: true`, no `beforeLogin` hook) ·
`src/lib/auth.ts:19-25` (`requireUser` checks existence only) · `src/lib/auth.ts:35-57`

**What's wrong**

`isPlatformAdmin` checks `status !== 'disabled'` (`src/access/index.ts:17`), but nothing else does.
Payload's login strategy has no knowledge of the custom `status` field, and the Company Admin path only
requires an **active membership**.

**Confirmed live** — with `users.status='disabled'` for `admin@auroragold.local`:

```
POST /api/users/login  → 200 "Authentication Passed" + token
GET  /dashboard        → 200  <h1>Dashboard</h1>
```

**Why it matters**

Offboarding a company employee by disabling their user account silently does nothing. They retain full
write access to their tenant's public-facing content, including publish transitions. `SECURITY.md` and
the `AGENTS.md` User model both treat `status` as meaningful.

**Suggested fix**

Add a `beforeLogin` hook on `Users` rejecting `status !== 'active'`, **and** re-check `user.status` in
`requireUser()` so existing tokens die immediately rather than at expiry.

---

## H4
### Media is not tenant-scoped and is writable by any authenticated user

**File:** `src/collections/Media.ts:5-21`

```ts
access: {
  create: ({ req }) => Boolean(req.user),
  read:   () => true,
  update: ({ req }) => Boolean(req.user),   // ← any user, any tenant, any record
}
```

The collection has **no `tenant` field at all** (fields: `alt` only).

**Why it matters**

Breaks `AGENTS.md:78` ("Every tenant-owned record must be scoped to a Company/Tenant"). Any Company
Admin from tenant A can overwrite the `alt` text of — and, via the upload endpoint, replace the file
behind — tenant B's logo or document. `read: () => true` also makes every uploaded asset world-readable
regardless of the owning record's publication status. This is the one collection where the otherwise-solid
isolation model has no coverage.

**Scope note:** latent today — the seed creates no media and `Companies.logo` is not wired up — so it
could not be demonstrated at runtime. It becomes live the moment logo/document upload ships.

**Suggested fix**

Add a required `tenant` relationship, apply the existing `tenantScopedRead` /
`tenantScopedCompanyAdminWrite` helpers, and scope read to published-tenant assets. Land this **with**
the logo work, not after.

---

# 🟡 MEDIUM

## M1
### The entire access-control layer is inert on every application code path

**Files:** `src/access/index.ts` (all) · every `payload.*` call in `src/`

**What's wrong**

Every Payload call in `src/` either passes `overrideAccess: true` explicitly or relies on the Local API
default — which is `true`:

```bash
grep -rn "overrideAccess" src/ | grep -v "overrideAccess: true"
# → (no results)
```

So `tenantScopedRead`, `companiesWriteAccess`, `Projects.access.*`, and all field-level `access.update`
guards run **only** for `/api/*` REST and GraphQL — never for the dashboard, the admin pages, or the
public site. `preventTenantFieldChange` (`src/access/index.ts:132`) and `authenticated` (`:63`) are
exported and never referenced anywhere. The tests know this: `tests/tenant-isolation.int.spec.ts:102`
passes `overrideAccess: false` explicitly to make the isolation assertion meaningful.

**Why it matters**

Isolation currently holds (verified — see [Verified OK](#verified-ok)), but on **one** layer only: the
manual `String(existingTenant) !== String(tenantId)` comparisons inside each server action, plus the
Projects `beforeChange` hook. `AGENTS.md:83` asks for server-side authorization; there is no backstop if
the next action forgets its manual check. `Companies` has no membership re-check in its hook at all
(`src/collections/Companies.ts:31-58` only strips platform-managed fields).

**Suggested fix**

Pass `overrideAccess: false` with `user` on the dashboard read/write paths so the declared access layer
actually executes. Keep `overrideAccess: true` only for public-site reads (which have their own explicit
tenant + status filters) and for seed. Delete or wire up the two dead exports.

---

## M2
### Multi-tenant users get a non-deterministic tenant, and there is no switcher

**File:** `src/lib/auth.ts:35-57`

```ts
const memberships = await payload.find({ ..., limit: 1, depth: 0, overrideAccess: true })
```

No `sort`, `limit: 1`. `AGENTS.md:149` states a User "has many tenant memberships." A user with Company
Admin on two tenants lands on whichever row Postgres returns first — which can change between requests
after an update — with no UI to choose.

**Why it matters**

Silent wrong-tenant editing for the first customer who has an IR consultant managing two issuers.
`ARCHITECTURE.md:24` asserts "one active tenant membership only," which the data model does not enforce.

**Suggested fix**

Near-term: add a stable `sort: 'createdAt'` and detect the multi-membership case explicitly (surface a
chooser or a clear "contact platform admin" state). Longer-term: put the selected tenant in the session
and validate it against memberships on every request.

---

## M3
### Placeholder public pages ship no title or description, and leak platform branding

**Files:** `src/app/(frontend)/news/page.tsx:31` · `investors/page.tsx` · `corporate/page.tsx` ·
`contact/page.tsx`

**What's wrong**

`news/page.tsx:31` exports `newsMetadata` — not a name Next recognizes, so it is dead code. The other
three placeholders export nothing. All four fall through to the root layout default.

**Confirmed live:**

```
/news  /investors  /corporate  /contact   →   <title>Mining IR Platform</title>
```

with `description="Investor relations websites for junior mining companies."`

**Why it matters**

Violates `AGENTS.md:401` ("Public pages must set a meaningful title and description"). These are four
public, indexable routes on a customer's investor site advertising the SaaS vendor instead of the issuer.
The root `template: '%s · Mining IR'` (`src/app/(frontend)/layout.tsx:21`) also stamps vendor branding
into every tenant page title.

**Suggested fix**

Add `generateMetadata` to each placeholder using the resolved tenant (`requirePublishedTenant()` is
already called in the component). Make the title template tenant-derived rather than `· Mining IR`.

---

## M4
### Mobile hero pushes all content below the fold

**Files:** `src/app/(frontend)/page.tsx:32-34` · `src/components/public/SiteHeader.tsx:27-36`

**What's wrong**

`min-h-[calc(100svh-5.5rem)]` assumes an 88px header, inside a `.hero-plane` that is itself
`min-height: 100svh`. At 375px the 7-link nav wraps to two rows.

**Measured at 375×812:** header `162px` (not 88), hero `886px` vs viewport `812px`. Content is
`justify-end`, so the first ~500px below the nav is empty green and the "View projects" / "Contact IR"
CTAs are clipped at the fold.

No horizontal overflow anywhere (`scrollWidth === innerWidth === 375` on `/`, `/projects`,
`/projects/[slug]`) — the layouts themselves are sound; this is the one broken viewport case.

**Suggested fix**

Drop the magic `5.5rem`. Make the hero a flex column with the header as a sibling (`min-h-[100svh]` on
the wrapper, `flex-1` on the content), or collapse the nav to a menu below `md`.

---

## M5
### Source links sit ~1.5 screens away from the technical claims they source

**File:** `src/app/(frontend)/projects/[slug]/page.tsx:82-87` (technical summary) vs `:105-123`
(source links `<aside>`)

**Measured at 375px on `/projects/north-ridge`:**

```
H2 "Technical summary"  @ y=1260
H2 "Map"                @ y=1469
H2 "Source links"       @ y=1818   ← 558px below the claims, behind the map placeholder
```

On desktop the aside is a right-hand column aligned to the top of the article, not to the technical
section. There is no inline citation, no anchor from the claim to the sources, and no per-claim linkage —
`sourceLinks` is a flat array with no relation to a specific statement.

**Why it matters**

Review priority #8 and `AGENTS.md:330`. The affordance exists (good — many implementations omit it
entirely), but "read this with the source documents" is only meaningful if the source is adjacent to the
claim.

**Suggested fix**

Render a compact source-link list directly beneath the Technical summary block (keep the aside as a full
index), and add an in-page anchor from the technical heading. Consider a `sourceLinks` relation on
individual `highlights` items for per-claim citation in Sprint 2.

---

## M6
### Integration tests re-implement the code under test instead of calling it

**File:** `tests/tenant-isolation.int.spec.ts:60-89`, `:141-207`

**What's wrong**

The published-only tests build their own `where: { and: [{tenant}, {status: published}] }` with
`overrideAccess: true` — the identical clause `src/lib/public-data.ts` builds. If someone drops `status`
from `getPublishedProjects`, these tests still pass. Neither `src/lib/public-data.ts` nor
`src/lib/tenant.ts` is imported by any test. The publish-flow test (`:141`) also runs with the default
`overrideAccess: true`, so it exercises the hook but not the access layer.

Uncovered rows from `docs/TESTING.md`'s own matrix:

- Unauthenticated user opens dashboard
- Anonymous access-layer reads
- Company Admin **writes** another tenant's *project* (only the Companies case is tested, `:109`)
- Invalid profile/project form → validation errors; no partial mutation

**Test hygiene:** the fixture at `:148-206` writes to the shared dev database and only deletes on the
success path. **One has already leaked** — `projects.id=4, slug='test-public-flow-1786449218096',
created_at 2026-08-11 20:53`, from an earlier interrupted run. It is Draft, so nothing is publicly
exposed.

**Suggested fix**

Import and assert against `getPublishedProjects` / `getPublishedProjectBySlug` / `resolveTenantSlug`.
Add an anonymous-read case with `overrideAccess: false` and no `user`. Move fixture cleanup into an
`afterEach` / `try…finally`. Add the four missing matrix rows.

**Pull this forward with C1** — without it, C1's fix has no regression net, and C1 is precisely the kind
of defect that reappears.

---

# 🟢 LOW

<a name="low"></a>

| # | File:line | Issue | Fix |
| --- | --- | --- | --- |
| L1 | `login/actions.ts:56,59` | `next.startsWith('/')` is the wrong shape — `//evil.com` and `/\evil.com` pass. **Tested:** Next 15.4's router normalized `//127.0.0.1:3001/projects` to `/projects`, so **not exploitable today**. Would become live if the redirect moves to a plain HTTP 302 path. | Reject `^//` and `^/\\`; allowlist known paths. |
| L2 | `Projects.ts:150-163`, `Companies.ts:157-163` | `sourceLinks[].url` and `socialLinks[].url` are unvalidated `text`. `SECURITY.md:25` requires URL validation. Rendered as a raw `href` at `projects/[slug]/page.tsx:114`. | Constrain to `https?://` with a field `validate`. |
| L3 | `dashboard/projects/actions.ts:86` | `tenant: Number(tenantId)` hard-casts to numeric IDs — breaks on UUID PKs or a Mongo adapter. | Pass `tenantId` through unchanged. |
| L4 | `dashboard/projects/actions.ts:121-126` | `findByID` unguarded; a nonexistent id throws past the handler → 500 instead of a form error state. (The tenant check at `:133` is correct.) | Wrap in try/catch; return the same `Forbidden.` for both cases. |
| L5 | `SiteHeader.tsx:27-36`, `layout.tsx:26-32` | No skip-to-content link (7 nav links precede `<main>` on every page); nav links measure **20px tall**, under WCAG 2.2 AA 2.5.8 (24×24) and far under mobile guidance; no `aria-current` on the active link. | Add skip link, pad nav links to ≥24px, set `aria-current="page"`. |
| L6 | `ProjectForm.tsx:156`, `CompanyProfileForm.tsx:173` | Field errors render as a loose `<p>` with no `aria-invalid` / `aria-describedby` on the input. (`FormMessage` correctly uses `role="alert"`.) | Give each error a stable id; wire `aria-describedby` + `aria-invalid`. |
| L7 | `lib/tenant.ts:32-34` | Missing `DEFAULT_TENANT_SLUG` throws a raw `Error` → 500 on the public root rather than a handled state. | Fail at startup, or `notFound()`. |
| L8 | `dashboard/projects/new/page.tsx` | No own `requireCompanyAdmin()`; protected only by the parent layout. Safe today (the action re-checks), but layout-as-auth is a known App Router footgun. | Call `requireCompanyAdmin()` in the page too. |
| L9 | `InvestmentHighlights.ts` / `Catalysts.ts` / `ShareStructures.ts` | No `assertPublicationTransition` — can be created directly as Published. Documented as known limitation #3, but `ShareStructures` carries `sharesOutstanding` / `fullyDiluted`, which are material and rendered on the homepage (`page.tsx:135`). | At minimum extend the gate to `share-structures`. |
| L10 | `projects/[slug]/page.tsx:38` | Breadcrumb shows `project.slug` rather than `project.name`. | Cosmetic. |

---

# Verified OK

<a name="verified-ok"></a>

Things actively attacked that held up:

- **Tenant isolation on the REST/GraphQL surface.** As the Aurora Gold Company Admin against a Northern
  Copper project (id 8, inserted as a fixture): `GET /api/projects/8` → `Not Found`;
  `PATCH /api/projects/8` → 403; `PATCH /api/companies/4` → 403; `POST /api/projects {tenant:4}` → 403.
  No existence leak — the read returns `Not Found`, matching `ARCHITECTURE.md:38`.
- **Cross-tenant dashboard reads.** `/dashboard/projects/8` (other tenant) and `/dashboard/projects/99999`
  (nonexistent) both return **404** — indistinguishable, no enumeration oracle. Correctly implemented at
  `dashboard/projects/[id]/page.tsx:28-33`.
- **Published-only public reads.** `/projects/hidden-lake` → 404. Anonymous `GET /api/projects` and the
  GraphQL equivalent return exactly the 2 published rows; the Draft project is absent from HTML, JSON,
  and metadata. `Users` and `TenantMemberships` reject anonymous reads outright.
- **The draft→published gate itself.** `draft → published` and `archived → published` are both rejected
  server-side, in the collection hook (so `overrideAccess` cannot bypass it) *and* in the server action.
  Create-as-Published is blocked. This half of ADR-0004 is correctly built — C1 is about content changes,
  not this transition.
- **Role separation.** Company Admin session → `/admin/tenants` → 307 `/login?error=unauthorized`.
  Platform Admin routes require `platformRole` via a server-side check in both the layout and each page.
  Payload CMS is correctly relocated to `/cms` with `admin: isPlatformAdmin`.
- **Membership status is enforced** — `findActiveCompanyAdminTenantId` requires `status: 'active'`, so
  revoking a membership works immediately (unlike H3's user status).
- **Ownership immutability.** `Projects.beforeChange:68-70` restores `data.tenant` from `originalDoc` for
  non-platform admins; `Companies.beforeChange:34-41` strips `slug` / `status` / `templateKey` /
  `subdomain` / `websiteDomain`. Tenant reassignment is not reachable from the dashboard.
- **Dashboard → public flow works end to end.** Verified by round-tripping a `technicalSummary` edit
  through `PATCH` and reading it back off the rendered public page; `revalidatePath` calls are present and
  correct for `/`, `/projects`, `/projects/[slug]`.
- **`PAYLOAD_SECRET || ''` fails fast.** Booting with an empty secret throws `missing secret key`. The
  `|| ''` fallback at `payload.config.ts:45` is cosmetic, not a weak-secret path.
- **Responsive layout is structurally sound.** Zero horizontal overflow at 375px on `/`, `/projects`,
  `/projects/[slug]`. Semantic landmarks present, heading order clean (`h1 > h2 > h2`), no missing `alt`,
  `prefers-reduced-motion` honored (`globals.css:113-122`), visible `:focus-visible` outline defined.
  M4 is the one broken viewport case.
- **Status is not conveyed by color alone** — `StatusBadge` renders a text label with the glyph
  `aria-hidden`, satisfying `AGENTS.md:402`.
- **Docs are complete and accurate.** Every file required by `AGENTS.md:374-390` exists; README covers
  prerequisites, env vars, DB setup, seed/reset, local login, test commands and the route map; the
  handoff's recorded results reproduce exactly.

---

# Verdict

<a name="verdict"></a>

**Not ready to mark Done.**

Everything else is in good shape — the isolation model, the publish-status filtering, and the role split
all held up under direct attack, and the docs/ADRs are genuinely complete. But `AGENTS.md:404-423` gates
Done on *"Technical disclosure cannot bypass human review,"* and it currently can.

### Must fix before Done

| # | Why it blocks |
| --- | --- |
| **C1** | Definition-of-Done line item and the ADR-0004 promise. Today an admin can put an unreviewed grade claim on the public site in one request, carrying a reviewer's name and timestamp that attest to something else. Nothing else on this list is close in severity. |
| **H2** | One-line fix, and it's a named review priority. No reason to carry it. |
| **H3** | Disabled users keep full access. Small fix (`beforeLogin` hook); offboarding should not ship broken. |
| **H1** | Restrict `x-tenant-slug` to trusted callers, or gate to non-production. The one-line `NODE_ENV` version is enough for Sprint 1. |

Plus **M6** pulled forward — without it, C1's fix has no regression net.

### Sprint 2 backlog (note explicitly in Known Limitations)

H4 (latent until uploads ship — but land it *with* the logo work), M1, M2, M3, M5, and the Low table.

**Rough estimate:** the four blockers are about a day of work, C1 being most of it.
