# AGENTS.md

## Mission
Build Sprint 2 of Mining IR Platform as the Mining Content extension of the self-service, multi-tenant SaaS serving junior mining companies.

Sprint 1 is the completed baseline. Preserve its working tenant isolation, Payload authentication, Explorer routes, Company Admin dashboard, Platform Admin routes and human-review foundation. Do not regress Sprint 1 behavior while adding Sprint 2.

## Current Sprint: Sprint 2 — Mining Content

Sprint 2 proves this loop:

1. A Company Admin creates or edits structured mining content for the authorized tenant.
2. Disclosure-sensitive content moves through Draft → Review → Published only after explicit human approval.
3. Investors see only the tenant's Published mining content in the Explorer website.

Use Aurora Gold as fictional demo data and Northern Copper as the isolation fixture. Demo claims must be clearly fictional and must not be presented as real investment advice.

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
- Fictional Aurora Gold seed records and at least one unpublished record per sensitive content type.
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
- Use fictional, clearly labeled Aurora Gold data only. Do not copy real company claims into the demo seed.

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

1. Platform Admin provisions the fictional first tenant, Aurora Gold.
2. Mining Company Admin edits tenant-scoped company and project data.
3. Public Explorer website renders only published Aurora Gold data for Investors.

## Product Direction
- Product: self-service investor relations website platform for junior mining companies.
- Business model direction: multi-tenant SaaS, not one-off freelance sites.
- First tenant: Aurora Gold, fictional demo mining company.
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
- Seed Aurora Gold as the first fictional tenant.
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
- Do not hard-code Aurora Gold as the only possible tenant.
- Aurora Gold may be hard-coded only as seed/demo data.
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
- Aurora Gold identity.
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
- Confirm Aurora Gold tenant settings.
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
- Aurora Gold seed content is fictional and clearly labeled where appropriate.
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
  decisions/
    ADR-0001-self-service-multi-tenant-saas.md
    ADR-0002-explorer-template-first.md
    ADR-0003-payload-postgres-nextjs-stack.md
    ADR-0004-human-approval-for-technical-disclosure.md
    ADR-0005-auth-tenant-resolution-cms-path.md
    ADR-0006-sprint2-mining-content-workflow.md
```

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
- Aurora Gold seed data exists.
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
- Hard-coded Aurora Gold assumptions outside seed/demo data.
- Missing human approval guard for technical disclosure.
- Incomplete dashboard-to-public-site data flow.
- Broken responsive layouts on investor pages.
- Missing source-link affordances near material technical claims.
