# Sprint 1 Review Handoff

> Historical terminology note: this document predates the Sprint 6 fixture identity rename. Quoted Aurora Gold/Northern Copper names, poison strings and slugs refer to retired fictional test fixtures and are preserved as historical evidence; they are not current tenants or Production identities.

Hand-off for post-implementation review (Claude or human). Read this after running the app locally. Product/engineering contract remains `AGENTS.md`.

**Status:** Sprint 1 vertical slice implemented and verified locally on 2026-08-11.

**App URL:** http://localhost:3000

---

## What shipped

1. **App stack:** Next.js `15.4.11`, React 19, TypeScript, Tailwind CSS 4, Payload CMS `3.87.1`, PostgreSQL via `@payloadcms/db-postgres`.
2. **Tenant-aware models:** `companies`, `projects`, `users`, `tenant-memberships`, `investment-highlights`, `catalysts`, `share-structures`, `media`.
3. **Seed data:** Aurora Gold (demo tenant), Northern Copper (isolation fixture), Platform Admin, Company Admin, published flagship project + draft project excluded from public.
4. **Public Explorer routes:** `/`, `/projects`, `/projects/[slug]` — Published content only.
5. **Placeholders only:** `/news`, `/investors`, `/corporate`, `/contact`.
6. **Company Admin routes:** `/login`, `/logout`, `/dashboard`, `/dashboard/company`, `/dashboard/projects`, `/dashboard/projects/new`, `/dashboard/projects/[id]`.
7. **Platform Admin routes:** `/admin/tenants`, `/admin/users` (distinct from Payload CMS UI).
8. **Payload CMS UI:** `/cms` (Platform Admin only via Payload access).
9. **Publication states:** Draft, Review, Published, Archived. Company/Project cannot skip Review to Published. Reviewer identity + timestamp recorded on approve.
10. **Server-side authZ:** session cookie, membership-scoped Company Admin writes, platform role for cross-tenant admin, public queries filtered to Published.
11. **Tests:** Vitest unit + integration coverage for review gate, tenant isolation, published-only reads, dashboard→public publish flow.
12. **Docs:** README setup/login, `docs/PRODUCT.md`, updated Architecture/Security, `ADR-0005`.

---

## Local login

After `npm run seed` (or `npm run seed:reset`):

> **Superseded (2026-08-17).** The literal passwords once printed here no longer work and have been
> removed. Local seed credentials come from `SEED_*` variables in your gitignored `.env.local`; see
> `README.md`. Retained as a historical record of Sprint 1 only.

| Role | Email | Password | Lands on |
| --- | --- | --- | --- |
| Platform Admin | `SEED_PLATFORM_EMAIL` | `SEED_PLATFORM_PASSWORD` | `/admin/tenants` |
| Company Admin (Aurora Gold) | `SEED_COMPANY_ADMIN_EMAIL` | `SEED_COMPANY_ADMIN_PASSWORD` | `/dashboard` |

Dev-only credentials. Do not use in production. Source of truth also in README and `.env.example`.

Public tenant for local single-host: `DEFAULT_TENANT_SLUG=aurora-gold`.

---

## Commands run and results

```bash
npm install
cp .env.example .env.local
# local Postgres DB: mining_ir
npm run seed:reset
npm run lint
npm run typecheck
npm test
npm run dev
```

| Command | Result |
| --- | --- |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm test` | **11/11 pass** (`tests/publishing.spec.ts` 6, `tests/tenant-isolation.int.spec.ts` 5) |
| `npm run seed:reset` | Pass — Aurora Gold + admins seeded |
| `npm run dev` | Pass — http://localhost:3000 |

### Manual / HTTP verification snapshot

| Check | Result |
| --- | --- |
| `GET /` | 200 — Aurora Gold published content; draft “Hidden Lake” absent |
| `GET /projects` | 200 — published projects only |
| `GET /projects/north-ridge` | 200 |
| `GET /projects/hidden-lake` | 404 (draft excluded) |
| `GET /dashboard` unauthenticated | 307 → `/login?next=/dashboard` |
| `GET /admin/tenants` unauthenticated | 307 → `/login?next=/admin/tenants` |
| Company Admin session → `/dashboard` | 200 |
| Company Admin session → `/admin/tenants` | 307 → `/login?error=unauthorized` |
| Platform Admin session → `/admin/tenants`, `/admin/users` | 200 |

Reviewer should still walk the manual smoke list in [`TESTING.md`](./TESTING.md) at desktop and mobile widths (forms, empty/validation/unauthorized/not-found states).

---

## Decisions recorded

| ADR / doc | Decision |
| --- | --- |
| [ADR-0001](./decisions/ADR-0001-self-service-multi-tenant-saas.md) | Multi-tenant SaaS; Aurora Gold is seed only |
| [ADR-0002](./decisions/ADR-0002-explorer-template-first.md) | Explorer template first |
| [ADR-0003](./decisions/ADR-0003-payload-postgres-nextjs-stack.md) | Payload + Postgres + Next.js stack |
| [ADR-0004](./decisions/ADR-0004-human-approval-for-technical-disclosure.md) | Human review before Published |
| [ADR-0005](./decisions/ADR-0005-auth-tenant-resolution-cms-path.md) | **Sprint 1 implementation choices:** Payload Users auth + `payload-token` cookie; `users.platformRole` for Platform Admin; memberships for Company Admin; public tenant resolution via header → subdomain → `DEFAULT_TENANT_SLUG`; Payload CMS at `/cms`; Postgres adapter `push: true`; Payload `3.87.1` + Next `15.4.11` |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Mirrors Sprint 1 implementation choices |
| [`SECURITY.md`](./SECURITY.md) | Documents selected auth integration |

---

## Known limitations

1. **Schema sync:** Postgres adapter uses `push: true` for Sprint 1 local speed; formal migrations are not yet the primary workflow.
2. **Tenant resolution:** Local/demo uses `DEFAULT_TENANT_SLUG` (and optional non-production `x-tenant-slug` / subdomain). In production, `x-tenant-slug` is ignored unless `TENANT_PROXY_SECRET` matches `x-tenant-proxy-secret`. Full custom-domain multi-tenant routing remains later scope.
3. **Review gate scope:** Disclosure-field lock + status transition gate apply to Company (`investmentThesis`, `longDescription`), Project (`technicalSummary`, `highlights`, `summary`, `ownershipPercent`, `sourceLinks`), and Share Structures. Investment highlights / catalysts can still be created as Published without the same Review transition (Sprint 1 homepage helpers).
4. **Placeholders:** News, Investors, Corporate, Contact, and dashboard Settings have no content workflows.
5. **Email:** No email adapter configured; Payload logs email to console.
6. **Visual QA:** Responsive CSS is implemented; a full visual pass in a real mobile browser viewport should still be done by the reviewer.
7. **CMS vs product admin:** Product Platform Admin owns `/admin/*`; Payload admin UI is at `/cms` to avoid route collision.
8. **npm audit (2026-08-11):** Critical Vitest UI advisory cleared by bumping `vitest` to `3.2.7`. Remaining advisories are mostly transitive under the Payload/Next pin. Do **not** run `npm audit fix --force` without a Payload compatibility check.
9. **Unfixed review findings (see `docs/SPRINT1_REVIEW.md`):** H4, M1–M5, L1–L10 remain open by design for this fix pass.

---

## Review fixes applied (2026-08-11)

Fixed only **C1, M6, H3, H2, H1** from `docs/SPRINT1_REVIEW.md`.

| ID | Fix | Verified |
| --- | --- | --- |
| **C1** | Disclosure-sensitive field lock on Published Company/Project; `review → published` must be status-only; dashboard split into Save changes vs Update status | `PATCH` published `technicalSummary` → **400**; public page unchanged. Unit + integration regression tests. |
| **M6** | Integration tests call `getPublishedProjects` / `getPublishedProjectBySlug` / `getPublishedCompanyBySlug`; anonymous `overrideAccess: false` read; cross-tenant project write; form schema validation; fixture cleanup in `try/finally` + `afterEach`; leaked `test-public-flow-*` cleaned in `beforeAll` | `npm test` **22/22** |
| **H3** | `Users.beforeLogin` rejects non-active; `requireUser()` redirects when `status !== 'active'` | Disabled login → **403**; existing token → dashboard **307** `/login` |
| **H2** | Homepage thesis heading uses `Why {company.displayName}` | Dev header `northern-copper` shows Northern Copper with **0** “Aurora Gold”; admin tenants copy left unchanged |
| **H1** | `x-tenant-slug` accepted only when `NODE_ENV !== 'production'` or trusted proxy secret matches | Production `next start` on `:3002`: header does **not** switch tenant (still Aurora Gold) |

### Commands re-run after fixes

| Command | Result |
| --- | --- |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm test` | **22/22 pass** |
| `npm run build` | Pass |
| Production header curl | Pass (no tenant switch) |

---

## Review focus (for Claude)

Prioritize in order:

1. Tenant isolation bugs (Company Admin cannot read/write Northern Copper).
2. Server-side authorization gaps (UI hiding is not enough).
3. Public exposure of Draft / Review / Archived content (HTML, JSON, metadata, errors).
4. Hard-coded Aurora Gold assumptions outside seed/demo/`DEFAULT_TENANT_SLUG`.
5. Missing human-approval guard for Project/Company publish transitions.
6. Broken dashboard → public update flow.
7. Responsive public layouts; source-link affordances on project detail.

Report findings by severity with file and line references.

---

## Key paths for review

```text
src/payload.config.ts
src/collections/
src/access/index.ts
src/lib/publishing.ts
src/lib/auth.ts
src/lib/tenant.ts
src/lib/public-data.ts
src/seed/index.ts
src/app/(frontend)/
tests/
docs/decisions/ADR-0005-auth-tenant-resolution-cms-path.md
docs/SPRINT1_REVIEW.md
```
