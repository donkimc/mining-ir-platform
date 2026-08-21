# AGENTS.md

## Mission
Build Mining IR Platform as a self-service, multi-tenant SaaS serving junior mining companies.

Sprints 1–4 are the completed, independently reviewed baseline. Preserve tenant isolation, Payload authentication, Explorer routes, Company Admin dashboard, Platform Admin routes, mining-content workflows, human-review controls, private storage authorization, public API minimization and the public discovery/map surfaces. Do not call the product ready for customer content until the promotion gates below are satisfied.

## Project Status (updated 2026-08-21)

| Sprint | Scope | Status |
| --- | --- | --- |
| 1 | Vertical slice — tenant, Explorer, dashboard, publication rules | ✅ Complete, reviewed |
| 2 | Mining content — news, documents, people, share structure, exploration | ✅ Complete, reviewed |
| 3 | Production hardening — private storage, secrets, TLS, migrations, guards | ✅ Complete, reviewed |
| 4 | Investor features — public discovery, read-only maps, Sprint 3 carry-ins | ✅ Complete, reviewed |
| 5 | Automation — ingestion, provenance, reviewer source checks (no external AI) | ✅ Implementation complete; review Ship with conditions (remediations on main) |
| 6 | Real-domain go-live, second tenant, summit template, marketing apex | ▶ Implementation in progress; DNS/cutover/review pending |

**Review record:** Sprint 1–5 reviews closed for Critical/High (Sprint 5 remediations in `359a9ce`). Sprint 6 review pending (`docs/SPRINT6_HANDOFF.md`).

**Verification command:** `npm run verify` = lint + typecheck + tests + migration-drift + retired-fixtures + `build:ci`.

### Deployment reality

- Vercel **Production** alias `https://mining-ir-platform.vercel.app` is backed by the Supabase **staging** project `jthotkkremiesvocfsmr`. "Vercel Production" and "Supabase Production" are not the same thing.
- The real production Supabase project `bwftfsfbiyzgwztwtqmh` has been **schema-migrated** (Sprint 2–5 migrations present as of 2026-08-19). It is still **empty of customer content**. Vercel Production alias remains on staging until an explicit cutover. Do not run `seed:reset` against Production.
- Vercel environment variables are **per-environment**. A variable set only for Preview does not reach a Production build. This has cost two debugging cycles.

### Open promotion gates — customer content and real Production go-live

1. ~~Migrate `bwftfsfbiyzgwztwtqmh` with `npm run migrate`~~ **Done 2026-08-19** (schema only; no `seed:reset`). Still require project-specific `DATABASE_SSL_CA` on any Vercel env that points at this DB, `PAYLOAD_DATABASE_PUSH=false` or absent, and fictional smoke before customer content. Explicit Vercel cutover from staging is separate.
2. Observe `DATABASE_SSL_CA` and `PAYLOAD_DATABASE_PUSH` from the **deployed** environment rather than assuming Sprint 3 configuration. Use `npm run check:env` / Vercel UI (Sensitive pulls may redact).
3. Never run `seed:reset` against the production project.

Staging restore rehearsal (L-3) is **complete and evidenced** — restored in place from a scheduled backup with smoke checks passing.

### Deferred low-severity findings from Sprint 4 (addressed in Sprint 5 implementation)

- **S4-3:** anonymous media authorization materializes up to 1000 IDs and silently caps. → pagination fix + fixtures in Sprint 5 (pending independent review).
- **S4-4:** ADR-0010 records no CSP or visitor-privacy analysis for the OSM embed. → ADR-0010 / SECURITY updated in Sprint 5 (pending independent review).
- **S4-5:** `README.md` and `docs/SPRINT1_HANDOFF.md` publish a local seed password that no longer works. → literal passwords removed from tracked docs in Sprint 5 (pending independent review).

## Current Sprint: Sprint 5 — Automation

Document ingestion, AI-assisted extraction and human approval workflow improvements. See `docs/ROADMAP.md`.

**Governing constraint (ADR-0004).** Sprints 1–4 protected against *human* error. Sprint 5 introduces machine-generated text into a securities-disclosure pipeline, which changes the threat model. The system currently records **who** approved a record but not **where the content came from** — there is no way to distinguish "a human approved human-written text" from "a human approved machine-generated text." That distinction is the safety story for this sprint and is a data-model decision. It must be settled in an ADR **before** implementation, not retrofitted.

**Second-order constraint.** If extraction uses an external LLM API, unpublished technical reports leave the tenant boundary. Decide whether that egress is acceptable at all — and on what retention, training and residency terms — before choosing a provider. Record it in an ADR.

**Non-negotiable.** No automatic publication. No investor PII. No market data. No SEDAR+ integration. Ingestion is a new write path into Media and must inherit tenant scoping, private-bucket authorization, UUID object keys and the published-reference rule for anonymous access — proven, not assumed.

## Sprint 4 Baseline — Investor Features (complete)

Delivered: public Explorer search/filtering over Published content only, related published-content navigation, read-only project maps from existing coordinates with an accessible text fallback, and the Sprint 3 carry-in fixes.

Decisions recorded in ADR-0009 (investor-feature boundary), ADR-0010 (map provider and data policy), ADR-0011 (public discovery contract).

**Rules established in Sprint 4 that apply to all future public surfaces:**

- Anonymous reads resolve **one** tenant server-side and filter `Published` at the data query — never fetch broadly and filter in React.
- The anonymous serializer strips `reviewedBy`, `reviewedAt`, `publishedAt`, `tenant`, `websiteDomain`, `subdomain` and `templateKey`. Any collection with its own `afterRead` must compose the shared serializer, not replace it.
- Maps are provider-neutral OpenStreetMap embeds with no API key. Third-party frames require an explicit CSP `frame-src` entry scoped to that origin — never a wildcard.
- Coordinates render only for Published, same-tenant records with valid WGS84 values. Failure must degrade to text, never to a blank rectangle.
- Every new public surface ships with a **negative-case fixture** — a Zenthoriq Resource record that must not appear. Two defects survived a full review cycle because no second-tenant record existed to leak.

## Sprint 3 Baseline — Production Hardening (complete)

The Sprint 3 sections below are retained as the historical contract and the standard for future hardening work. All gates were independently verified closed.

## Sprint 3 Decision

Close release-critical security and operations gaps before adding live market data, investor analytics, subscriptions or other investor expansion. This keeps the next Cursor task small, testable and appropriate for a securities-adjacent product where unpublished technical content must remain private.

## Sprint 3 Scope

- Make the Supabase Storage bucket private and prove that direct object URLs cannot download Draft, Review or unauthorized files; all permitted access must use the application authorization path.
- Rotate every credential that appeared in the review material, including the session signing secret, invalidate old sessions, and verify that no secret remains in Git, Notion, logs or build output.
- Require verified PostgreSQL TLS with a configured CA in Preview and Production; remove or tightly quarantine the insecure certificate-verification escape hatch.
- Test an incremental Payload migration against a database created from the prior Sprint 2 schema. Record upgrade, rollback/forward-recovery and drift results.
- Upload at least one fictional Qelvarion Resource document to cloud staging and test Draft/Review denial, Published access, redeploy persistence and direct-object denial.
- Expand security regression tests across every tenant-owned collection, including the four original collections and all Sprint 2 collections. Cover cross-tenant reads/writes, public serializers, reviewer metadata, API enumeration and related-record ownership.
- Prevent production database guard waivers and schema auto-push. Production and Preview must fail closed when migration or required security configuration is missing.
- Minimize anonymous API responses so they expose only intentionally public Published fields and never internal reviewer IDs, tenant enumeration or draft existence.
- Commit all remediation changes, migrations, tests and documentation. A clean verification result from uncommitted changes is not a release artifact.
- Document backup/restore, rollback, incident response, session invalidation, storage recovery, logs and alert ownership. Perform a restore rehearsal against a non-production database.
- Deploy and verify a Vercel Pro Preview backed by Supabase Pro staging. Do not promote to Production while any blocker remains open.

## Sprint 3 Out of Scope

- Live stock quotes, market-data licensing or investment analytics.
- Investor accounts, CRM, subscriptions, email alerts or billing.
- AI extraction, automated ingestion or automatic publication.
- SEDAR+ or regulatory integrations.
- Advanced GIS, drill-hole visualization, 3D maps or predictive analytics.
- Additional production templates, custom domains or self-serve provisioning.

## Sprint 3 Promotion Blockers

Do not mark Sprint 3 Done, and do not promote to Production, if any of these is unresolved:

1. A Supabase Storage object is downloadable through a direct public URL when it should be private.
2. Any exposed credential or session secret remains active.
3. Preview/Production can run without verified database TLS.
4. An incremental migration has not been exercised against an older schema.
5. Cloud media behavior has only been tested with zero uploaded files.
6. Production guardrails can be waived through environment defaults or undocumented flags.
7. Security remediation is not committed and reproducibly verified.

## Sprint 3 Definition of Done

- `npm run verify` passes on the exact committed release candidate.
- All Sprint 1 and Sprint 2 routes and tests still pass.
- Private storage, secret rotation, TLS, migration upgrade and cloud media tests have recorded evidence.
- All nine tenant-owned content families have tenant, role, published-only and metadata-minimization coverage.
- Production configuration fails closed for missing TLS, unsafe schema push and missing required secrets.
- Backup restore rehearsal and rollback/runbook review are complete.
- Vercel Preview is verified against Supabase Pro staging with fictional data and staging-only accounts.
- Claude or another independent reviewer has reviewed the deployed Preview and all Critical/High findings are closed or explicitly accepted by the Product Director.
- Sprint 3 handoff records changed files, commit, commands, results, deployment URL, database project, migration evidence, media evidence, known limitations and any deferred work.

The original investor-feature ideas are moved to Sprint 4 in `docs/ROADMAP.md` and must not be pulled into this hardening sprint without a documented scope decision.

## Sprint 2 Baseline — Mining Content

Sprint 2 proves this loop:

1. A Company Admin creates or edits structured mining content for the authorized tenant.
2. Disclosure-sensitive content moves through Draft → Review → Published only after explicit human approval.
3. Investors see only the tenant's Published mining content in the Explorer website.

Use Qelvarion Resource as fictional demo data and Zenthoriq Resource as the isolation fixture. Demo claims must be clearly fictional and must not be presented as real investment advice.

## Sprint 2 Scope

Implement the narrowest complete mining-content workflow on top of Sprint 1.

### In Scope

- News Release collection and Company Admin management.
- Document/presentation collection with external links and metadata.
- Management/team profiles using the existing tenant-scoped pattern.
- Share Structure records with date, share counts, sources and review state.
- Exploration content references or drill-result summaries with source links and review state.
- Shared Draft, Review, Published and Archived workflow for all Sprint 2 content.
- Reviewer identity and review timestamp on approval.
- Public Explorer sections for published News, Documents, Management, Share Structure and Exploration content.
- Tenant isolation, role authorization, published-only reads and disclosure-review tests for every new collection.
- Fictional Qelvarion Resource seed records and at least one unpublished record per sensitive content type.
- Documentation and ADR updates for implementation choices.

### Sprint 2 Required Routes

- Public: /news, /news/[slug], /documents, /management, /share-structure, and project exploration content using the existing route convention.
- Company Admin: /dashboard/news, /dashboard/documents, /dashboard/management, /dashboard/share-structure, /dashboard/exploration.
- Existing Sprint 1 routes must continue to work.

### Sprint 2 Out of Scope

- Live stock quotes, market data or investor analytics.
- Investor accounts, CRM, subscriptions or email alerts.
- AI extraction, automated ingestion or automatic publication.
- SEDAR+ or regulatory filing integrations.
- Advanced GIS, drill-hole visualization, 3D maps or predictive analytics.
- Billing, custom domains or production provisioning.
- Additional production templates beyond Explorer.

## Sprint 2 Content Rules

- Every new record must carry an explicit tenant/company relationship.
- Every dashboard read and write must enforce server-side tenant membership.
- Public queries must filter by both tenant and status = Published.
- Draft, Review and Archived content must not appear in public HTML, metadata, API responses or error messages.
- Technical or financially material content must be review-gated. A content edit and an approval transition must be separate operations.
- A Published disclosure-sensitive record cannot be edited in place. Its content must return to Review or the write must be rejected, with prior Published content remaining public until the replacement is approved.
- Approval must be status-only against content already at rest; the same request must not both change disclosure fields and approve them.
- Approval records reviewedBy, reviewedAt and publishedAt where applicable; reviewer values are server-derived.
- Source URL or source document is required for technical claims, exploration results, share counts and material financial facts.
- Use fictional, clearly labeled Qelvarion Resource data only. Do not copy real company claims into the demo seed.

### Sprint 2 Content Fields

Minimum fields, adapted to existing code conventions:

- News Release: tenant, title, slug, release date, excerpt, body, source URL/document, related project, disclosure level, status, review metadata.
- Document: tenant, title, slug, category, publication date, external URL or uploaded media, related project, disclosure level, status, review metadata.
- Person: tenant, name, role title, group, biography, headshot/media, display order, status, review metadata where biography is disclosure-sensitive.
- Share Structure: tenant, as-of date, shares outstanding, options, warrants, fully diluted, explanatory note, source URL/document, status, review metadata.
- Exploration Content: tenant, project, title, result/summary, relevant date, technical details, source URL/document, disclosure level, status, review metadata.

### Sprint 2 UX Requirements

- Dashboard navigation exposes each content type without overwhelming the user.
- Each content type supports list, create, edit, status/review state and empty states.
- Sensitive content has separate Save Draft, Submit for Review and Approve & Publish actions where the role permits.
- Published content shows a clear read-only or edit-to-new-draft behavior.
- Public content shows publication date, source context and a clear distinction between factual data and demo placeholders.
- Preserve loading, empty, validation, save-success, save-error, unauthorized, forbidden and not-found states.

Sprint 1 proves this loop:

1. Platform Admin provisions the fictional first tenant, Qelvarion Resource.
2. Mining Company Admin edits tenant-scoped company and project data.
3. Public Explorer website renders only published Qelvarion Resource data for Investors.

## Product Direction
- Product: self-service investor relations website platform for junior mining companies.
- Business model direction: multi-tenant SaaS, not one-off freelance sites.
- First tenant: Qelvarion Resource, fictional demo mining company.
- First template: Explorer, optimized for junior exploration companies.
- MVP personas:
  - Investor: public visitor, no login.
  - Mining Company Admin: authorized tenant user managing company website content.
  - Platform Admin: master admin managing tenants, users, roles, templates and platform settings.

## Required Stack
Use the agreed Sprint 0 stack unless explicitly instructed otherwise:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Payload CMS
- PostgreSQL / Supabase
- Initial hosting target: Vercel
- DNS/CDN target: Cloudflare

Do not replace the stack with a different framework or CMS without a documented architecture decision.

## Sprint 1 Scope
Implement the narrowest useful vertical slice.

### In Scope
- Initialize the application and development tooling.
- Add repository documentation structure.
- Create tenant-aware Company/Tenant model.
- Seed Qelvarion Resource as the first fictional tenant.
- Create Project model linked to Company/Tenant.
- Render public Explorer homepage from tenant-scoped published data.
- Render public project list and project detail pages.
- Create company dashboard shell with authenticated tenant context.
- Allow Company Admin to edit company profile data.
- Allow Company Admin to create/edit project data.
- Implement draft/review/published/archived status for publishable content.
- Ensure public pages show Published content only.
- Create minimal Platform Admin tenant/user management foundation.
- Add tests or verification checks for tenant isolation, published-only public reads and dashboard-to-public update flow.

### Sprint 1 Required Routes

- Public: `/`, `/projects`, `/projects/[slug]`.
- Company Admin: `/dashboard`, `/dashboard/company`, `/dashboard/projects`.
- Platform Admin: `/admin/tenants`, `/admin/users`.
- Authentication: `/login` and `/logout` or the equivalent provided by the selected auth integration.

The public Sprint 1 surface is limited to Home, Projects and Project Detail. News, Investors, Corporate and Contact may be represented by placeholders or navigation stubs only; do not build their content workflows in Sprint 1.

### Out of Scope
- Automated SEDAR+ ingestion.
- Live stock quote integration.
- Full investor CRM.
- Billing/subscription automation.
- AI investor chatbot.
- Social media automation.
- Advanced GIS or drill-hole visualization.
- Predictive analytics or investment recommendations.
- Fully automated publication of technical mining disclosure.
- Multiple production templates beyond Explorer.
- Self-serve public signup for mining companies.

## Architecture Rules
- Every tenant-owned record must be scoped to a Company/Tenant.
- Do not hard-code Qelvarion Resource as the only possible tenant.
- Qelvarion Resource may be hard-coded only as seed/demo data.
- Company Admins can access only their authorized tenant.
- Platform Admins can manage all tenants.
- Server-side authorization is mandatory. UI hiding is not authorization.
- Public pages must query Published content only.
- Draft and Review content may appear only in authenticated dashboard or preview contexts.
- Keep public investor routes and private dashboard/admin routes clearly separated.

### Authentication and Authorization

- Use the repository's selected auth integration; document the choice in `docs/SECURITY.md` and environment variables in `README.md`.
- A session must identify the user and be checked server-side for every dashboard/admin read and write.
- A Company Admin must have an active membership for the requested tenant. Never trust a tenant ID supplied only by the browser.
- Platform Admin authorization is a separate server-side role check and may operate across tenants.
- Unauthenticated users may access only public published routes.
- Return a clear unauthorized or forbidden response rather than leaking whether another tenant's record exists.
- Include a development-only seeded admin path or documented local login procedure; do not commit real credentials.

## Core Data Model
Implement names and details according to the codebase conventions, but preserve these concepts.

### Company / Tenant
Fields:
- id
- legalName
- displayName
- slug
- status
- templateKey
- primaryCommodity
- jurisdiction
- tickerSymbol
- exchange
- websiteDomain
- subdomain
- logo
- brandColors
- shortDescription
- longDescription
- investmentThesis
- irContactName
- irContactEmail
- irContactPhone
- officeAddress
- socialLinks
- createdAt
- updatedAt

Relationships:
- has many users/memberships
- has many projects
- has many news releases
- has many documents
- has many people
- has many share structure records
- has many investment highlights
- has many catalysts

### User
Fields:
- id
- email
- name
- authProviderId
- status
- createdAt
- updatedAt

Relationships:
- has many tenant memberships

### Tenant Membership
Fields:
- id
- userId
- tenantId
- role
- status
- invitedAt
- acceptedAt

Roles:
- Platform Admin
- Company Admin
- Editor
- Viewer

Sprint 1 may implement Platform Admin and Company Admin first if needed.

### Project
Fields:
- id
- tenantId
- name
- slug
- status
- isFlagship
- commodity
- jurisdiction
- locationSummary
- latitude
- longitude
- ownershipPercent
- stage
- summary
- highlights
- technicalSummary
- sourceDocumentId
- displayOrder
- createdAt
- updatedAt

### News Release
Fields:
- id
- tenantId
- projectId optional
- title
- slug
- releaseDate
- excerpt
- body
- sourceUrl
- documentId optional
- disclosureLevel
- status
- reviewedBy
- reviewedAt
- publishedAt
- createdAt
- updatedAt

### Document
Fields:
- id
- tenantId
- title
- slug
- category
- fileUrl
- externalUrl
- publicationDate
- status
- disclosureLevel
- relatedProjectId optional
- createdAt
- updatedAt

### Person
Fields:
- id
- tenantId
- name
- roleTitle
- group
- biography
- headshotUrl
- displayOrder
- status
- createdAt
- updatedAt

### Share Structure
Fields:
- id
- tenantId
- asOfDate
- sharesOutstanding
- options
- warrants
- fullyDiluted
- marketCapNote
- sourceDocumentId optional
- status
- createdAt
- updatedAt

### Investment Highlight
Fields:
- id
- tenantId
- title
- summary
- displayOrder
- status

### Catalyst
Fields:
- id
- tenantId
- title
- expectedTiming
- summary
- status
- displayOrder

## Publishing Rules
Use these statuses for publishable content:

- Draft
- Review
- Published
- Archived

Rules:
- Public site renders only Published records.
- Draft records are editable in dashboard only.
- Review records are awaiting human approval.
- Archived records are hidden from public pages by default.
- Technical mining disclosure must not move directly from AI-generated/draft content to Published.
- Human approval is required before technical mining disclosure is published.
- For disclosure-sensitive Project and Company fields, store or expose review state, reviewer identity and review timestamp when the record is approved.
- Sprint 1 may use a manual Company Admin or Platform Admin review action, but the transition must be explicit and server-validated.

## Public Explorer Website
Build the Explorer public experience first.

### Required Pages
- Home
- Projects
- Project detail
- News placeholder only; no news workflow in Sprint 1.
- Investors placeholder only; no investor account or CRM in Sprint 1.
- Corporate placeholder only; no corporate content workflow in Sprint 1.
- Contact placeholder only; no contact submission workflow in Sprint 1.

### Homepage Requirements
Show:
- Qelvarion Resource identity.
- Ticker/exchange placeholder.
- One-sentence company positioning.
- Investment thesis.
- Investment highlights.
- Flagship project.
- Recent news or news placeholder.
- Key metrics: commodity, jurisdiction, project stage, ownership and share count.
- Upcoming catalysts.
- Corporate presentation/document link placeholder.
- Contact or subscribe prompt.

### Project Detail Requirements
Show:
- Project summary.
- Jurisdiction and location summary.
- Commodity.
- Ownership.
- Stage.
- Exploration highlights.
- Map placeholder for Sprint 1.
- Related published documents/news if available.
- Source-link area for material technical claims.

## Client Dashboard
Build a simple but real dashboard foundation.

Required areas:
- Overview
- Company Profile
- Projects
- Preview or public page links
- Settings placeholder

Company Profile editing should support:
- display name
- ticker
- exchange
- short description
- long description
- investment thesis
- IR contact name/email/phone
- basic branding fields if feasible

Project editing should support:
- name
- slug
- commodity
- jurisdiction
- stage
- ownership
- summary
- highlights
- status

## Platform Admin
Build the minimum needed to preserve master-admin control:

- View tenants.
- Confirm Qelvarion Resource tenant settings.
- Assign or represent user membership/role.
- Keep Platform Admin access separate from Company Admin access.

## Sprint 2 Definition of Done

- All Sprint 1 routes and tests still pass.
- Every Sprint 2 collection is tenant-scoped and protected server-side.
- Company Admin can manage each Sprint 2 content type for the authorized tenant only.
- Platform Admin access remains separate and cross-tenant where intended.
- Public Explorer pages render Published Sprint 2 content only.
- Draft, Review and Archived content are excluded from public responses and metadata.
- Published sensitive content cannot be silently rewritten without review.
- Approval is a separate, server-validated status-only action with reviewer identity and timestamp.
- Technical and material content has source-link or source-document affordances.
- Qelvarion Resource seed content is fictional and clearly labeled where appropriate.
- Tests cover own-tenant access, wrong-tenant access, role boundaries, published-only reads, review gates and public rendering.
- Lint, typecheck, tests and production build pass.
- README, architecture, data model, design, security, testing, roadmap, ADR and Sprint 2 handoff are updated.
- Deployment documentation is updated and Vercel Pro Preview backed by Supabase Pro staging is verified.
- Cursor reports changed files, commands, test results, known limitations and deferred findings.

## Repository Documentation
Create or maintain this structure:

```text
AGENTS.md
README.md
docs/
  PRODUCT.md
  ARCHITECTURE.md
  DATA_MODEL.md
  DESIGN.md
  ROADMAP.md
  SECURITY.md
  TESTING.md
  DEPLOYMENT.md
  OPERATIONS.md
  SPRINT1_HANDOFF.md … SPRINT4_HANDOFF.md
  SPRINT2_REVIEW.md, SPRINT2_REREVIEW.md, SPRINT2_CARRYFORWARD.md
  SPRINT3_REVIEW.md, SPRINT4_REVIEW.md
  decisions/
    ADR-0001-self-service-multi-tenant-saas.md
    ADR-0002-explorer-template-first.md
    ADR-0003-payload-postgres-nextjs-stack.md
    ADR-0004-human-approval-for-technical-disclosure.md
    ADR-0005-auth-tenant-resolution-cms-path.md
    ADR-0006-sprint2-mining-content-workflow.md
    ADR-0007-supabase-storage-and-migrations.md
    ADR-0008-production-readiness-gates-before-investor-features.md
    ADR-0009-sprint4-investor-feature-boundary.md
    ADR-0010-project-map-provider-and-data-policy.md
    ADR-0011-public-explorer-discovery-contract.md
```

Each sprint adds a handoff (what was built, what was verified, what was not) and an independent review. A handoff must state what it could **not** verify rather than omitting it.

Required documentation must be present before Sprint 1 is marked Done. README setup instructions must include prerequisites, environment variables, database setup, seed/reset commands, local login, test commands and the route map.

## Required UX States

Public pages and dashboard forms must include intentional loading, empty, validation-error, save-success, save-error, unauthorized and not-found states. Forms must validate required fields, preserve stable layouts, and avoid exposing draft content in public responses.

## Accessibility and SEO Minimums

- Use semantic headings, labels, keyboard-accessible controls, visible focus states and sufficient color contrast.
- Public pages must set a meaningful title and description and use stable slug-based URLs.
- Do not rely on color alone for status or disclosure state.

## Definition of Done
Before marking Sprint 1 work complete:

- App starts locally.
- README explains setup and available scripts.
- Tenant-owned data is scoped by Company/Tenant.
- Qelvarion Resource seed data exists.
- Public Explorer pages render from structured data.
- Public pages show Published content only.
- Company Admin dashboard can update tenant-scoped data.
- Company Admin cannot access another tenant.
- Platform Admin control is separate from Company Admin access.
- Publish/review status is visible for publishable records.
- Technical disclosure cannot bypass human review.
- Lint/type checks/tests run where available.
- Local database setup, seed and reset steps are documented and reproducible.
- Authentication and authorization behavior is documented and manually verified.
- Loading, empty, validation, unauthorized and not-found states are manually checked.
- Responsive public pages are manually checked on mobile and desktop widths.
- Important decisions are documented in ADRs.

## Review Focus
When reviewing implementation, prioritize:

- Tenant isolation bugs.
- Server-side authorization gaps.
- Public exposure of Draft or Review content.
- Hard-coded Qelvarion Resource assumptions outside seed/demo data.
- Missing human approval guard for technical disclosure.
- Incomplete dashboard-to-public-site data flow.
- Broken responsive layouts on investor pages.
- Missing source-link affordances near material technical claims.
- Provenance of machine-generated content, once automation exists.

## Evidence Rules (learned across four review cycles)

These are not style preferences. Each one is the direct product of a defect that shipped.

1. **Verify at the layer that must actually succeed.** Every sprint shipped a defect found one layer below where evidence was gathered — a green test suite over a failing build (Sprint 1), an app route over a public storage bucket (Sprint 2), a stale deployment URL over the live one (Sprint 3), server-rendered HTML over browser execution (Sprint 4). The markup was correct every time.

2. **A green suite is not evidence the app runs.** `npm run verify` includes `build:ci` and migration-drift for this reason. Deployed behaviour still requires a deployed observation.

3. **Schema changes require a generated migration in the same commit.** Local `push: true` masked a missing migration and broke staging. Drift CI now enforces this.

4. **Isolation tests need a negative fixture.** A test with nothing to leak proves nothing. Seed the Zenthoriq Resource record that must not appear.

5. **For race-shaped or timing-dependent behaviour, one successful observation is not evidence.** Repeat it. A map that worked once was removed on half of subsequent loads.

6. **Fix the class, not the instance.** Remediations that fixed only the named file produced follow-up findings in three consecutive sprints. After each fix ask: *what else has this shape?*

7. **Report what you could not verify.** "Not verified" is a valid and useful result. A completion report that claims a passing check which does not pass costs a full review cycle.
