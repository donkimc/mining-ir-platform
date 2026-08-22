# Sprint 6 Handoff - Real-Domain Go-Live And Second Tenant

## Status

**Implementation in progress on `main`.** ADRs 0016–0021 accepted; fail-closed hostname resolution, admin-host middleware, summit template, marketing apex site, `/about`, multi-listing migration and renamed fixtures are in code. Sprint 6 is **not Done** until Preview/Production DNS/TLS/cutover evidence and independent review close Critical/High findings. Do not promote customer content.

### Registry clearance (S6-01) — recorded 2026-08-21

See ADR-0021. Working names Qelvarion (`QVRN`), Zenthoriq (`ZQRI`) and Veylithra (`VYTH`) adopted after web/SEDAR+/EDGAR-oriented searches found no matching issuers or tickers (near-misses such as Zenithra / Q-Gold are distinct).

## 1. Sprint Goal And Non-Goals

### Goal

Prove the platform's multi-tenant claim with two fully populated, clearly fictional mining companies
served on real hostname-based tenant subdomains of `nrlaunch.com`, while preserving every Sprint 1-5
disclosure, storage, authentication and isolation gate. The sprint renames the existing fixture
identities, makes hostname resolution fail closed, adds the approved `summit` presentation template,
maps the supplied reference information architecture onto the platform, creates a second tenant with
meaningfully different content, and promotes the reviewed release candidate to the real Production
database.

### Approved product decisions

Approved by the Product Director on 2026-08-20:

| Decision | Result |
| --- | --- |
| Platform apex | `nrlaunch.com` serves the platform marketing/product site |
| `www` | Canonical redirect to `nrlaunch.com` or the documented marketing host; it never resolves to a tenant |
| Tenant websites | Every demo company is a normal tenant with its own subdomain; there is no `demo.` subdomain |
| Platform Admin/CMS | `admin.nrlaunch.com` is the dedicated Platform Admin and CMS host |
| Second template | `summit` is approved as a second presentation template, reconciled with ADR-0002 below |
| Historical evidence | Historical Sprint 1-5 values are preserved with a mapping note and bounded allowlist |
| Custom customer domains | Out of scope for Sprint 6, but the routing model must not block future CNAME domains |

### Explicit non-goals

- No `demo.nrlaunch.com` host and no special demo-only tenant behavior.
- No custom customer domains in this sprint; no automated domain verification or certificate
  lifecycle for customer-owned domains.
- No billing, subscriptions, self-service public signup or provisioning automation.
- No investor accounts, investor PII, CRM, alerts, market data or investment recommendations.
- No external AI egress, provider SDK, provider secret or automatic publication (ADR-0013).
- No SEDAR+ integration, regulatory filing ingestion or live market-data integration.
- No advanced GIS, predictive analytics, technical interpretation or reserve estimation.
- No more than one new presentation template beyond the existing Explorer template.
- No alteration of historical review evidence to make old fixture names appear current.

## 2. Fixture Rename Plan

### Confirmed working identities

The Product Director selected these deliberately coined names. They are approved as working names but
must pass the formal clearance gate before they enter active seed data or Production.

| Role | Working legal/display name | Slug | Fictional ticker |
| --- | --- | --- | --- |
| Primary demo tenant | Qelvarion Resource Corp. | `qelvarion-resource` | `QVRN` |
| Isolation/poison tenant | Zenthoriq Resource Ltd. | `zenthoriq-resource` | `ZQRI` |
| Second fully populated tenant | Veylithra Tungsten Corp. | `veylithra-tungsten` | `VYTH` |

Retired prior fixture identities and the rename mapping are recorded in ADR-0021.

Before adoption, search each name, slug, ticker, project name and domain against SEDAR+, EDGAR and
the relevant company registry. Record source, date, search term, result and Product Director decision
in the Sprint 6 completion record. Replace any conflicting name or ticker before implementation.
Use `.example` for fictional web domains and `.local` or `.staging` for seed account emails.

### Location inventory

Rename active references in all of these locations:

- `src/seed/index.ts`: companies, legal/display names, project names, news, documents, people, share
  structure, exploration content, highlights, catalysts, contacts, social links, emails, domains,
  slugs and tickers.
- `tests/`: tenant lookup, email defaults, route assertions, project slugs, poison strings
  (`ZENTHORIQ SECRET`, `ZENTHORIQ CATALYST SECRET`, `hollowspire-isolation`) and fixture variable names.
- `.env.example` and deployment environment values for local/Preview `DEFAULT_TENANT_SLUG=qelvarion-resource`.
- Living docs: `AGENTS.md`, `README.md`, `docs/ROADMAP.md`, `docs/PRODUCT.md`, `docs/DATA_MODEL.md`,
  `docs/DESIGN.md`, `docs/SECURITY.md`, `docs/TESTING.md`, `docs/DEPLOYMENT.md` and
  `docs/OPERATIONS.md`.
- Active ADRs and current Sprint 6 documents.
- Fictional records in staging (`jthotkkremiesvocfsmr`) and any fictional records in Production
  (`bwftfsfbiyzgwztwtqmh`). Do not use a destructive Production reset.

Current negative fixtures use `ZENTHORIQ SECRET`, `ZENTHORIQ CATALYST SECRET` and
`hollowspire-isolation`. Retired tokens are listed only in ADR-0021 and historical Sprint 1–5
evidence files.

### Historical-document decision

Do not rewrite Sprint 1-5 reviews or handoffs that quote the old values as evidence. Add the
historical terminology note from ADR-0021 at the top of each affected historical document (exact
wording lives there so this handoff does not re-quote retired tokens).

The literal requirement "zero occurrences across tracked files" conflicts with preserving those
quoted audit records. The accepted solution is a bounded historical allowlist:

- Current source, seed, tests, living docs, deployment output and rendered public output contain zero
  retired terms.
- Only explicitly named historical review/handoff files may retain retired terms.
- The scan fails if a new historical file is added to the allowlist without a documented decision.
- A second check proves the allowlist files remain unchanged except for the mapping note.

### Verification command

Add a repository script, for example `npm run check:retired-fixtures`, that:

1. Enumerates tracked files with `git ls-files`.
2. Excludes only the explicitly documented historical review/handoff allowlist.
3. Searches case-insensitively for the retired fixture tokens documented in ADR-0021 (slugs, legal
   names, tickers, poison strings and project slugs).
4. Fails on any active source, test, seed, living documentation or configuration match.
5. Scans the built/rendered public output as a separate step.

Wire it into `npm run verify`. The handoff must include the exact command, output and allowlist used.

## 3. Domain And Tenant Resolution Plan

### Required hostname behavior

Demo companies are ordinary tenants. Their fictional status exists in their content and documentation,
not in a `demo.` hostname.

| Hostname | Required behavior | Tenant resolution |
| --- | --- | --- |
| `nrlaunch.com` | Platform marketing/product site | No tenant; never `DEFAULT_TENANT_SLUG` |
| `www.nrlaunch.com` | Redirect to the canonical apex or serve the same marketing site | No tenant; never `DEFAULT_TENANT_SLUG` |
| `qelvarion-resource.nrlaunch.com` | Qelvarion public site | Resolve exact normalized subdomain to active/published tenant |
| `veylithra-tungsten.nrlaunch.com` | Veylithra public site | Resolve exact normalized subdomain to active/published tenant |
| `zenthoriq-resource.nrlaunch.com` | Isolation fixture site when deliberately enabled | Resolve exact normalized subdomain; never leak it into another tenant |
| `admin.nrlaunch.com` | Platform Admin/CMS host | No public tenant; authenticated membership/role determines scope |
| `typo.nrlaunch.com` | Controlled 404/setup response | No fallback; do not serve a real tenant |
| `nrlaunch.com:443` or mixed-case/trailing-dot variants | Normalize safely, then apply the same rules | Port is not part of the tenant key |
| `*.vercel.app`, localhost and test hosts | Explicit non-Production development/Preview behavior | Test host or local fallback only where documented |

The current first-label implementation has never executed in Production. Treat it as unproven code,
not as a configuration task. The key defect to fix is the current fallback from an unknown host to a
real tenant.

### Resolver contract

The resolver must:

1. Normalize lowercase hostname, trailing dot and port handling.
2. Recognize apex, `www`, `admin` and known platform/deployment hosts before extracting a tenant label.
3. Accept a tenant only when the full host is exactly `<normalized-subdomain>.nrlaunch.com` and the
   matching Company is active and published.
4. Reject reserved labels (`www`, `admin`, `app`, `api`, `cms`, `demo`, `staging`, `preview`, `mail`)
   and malformed labels.
5. Resolve the tenant server-side before public queries, metadata, media authorization and server
   actions. Never trust a browser tenant ID.
6. Return 404/setup behavior for unknown, inactive, unpublished or conflicting subdomains.
7. Never fall back to a tenant after a Production hostname has been recognized as an `nrlaunch.com`
   request.
8. Keep any trusted proxy/test header unavailable in Production unless the existing trusted secret
   mechanism is present and valid.

### What replaces `DEFAULT_TENANT_SLUG`

`DEFAULT_TENANT_SLUG` becomes **local-development and script-only** configuration. It must be absent
from Vercel Preview and Production. Tests should inject an explicit host or resolver input rather than
depending on an ambient default. Seed/import scripts may use an explicit tenant slug argument.

For a single-host local server, the fallback is acceptable only when `NODE_ENV !== production` and the
request is not a recognized `nrlaunch.com` host. A missing local fallback must fail clearly rather than
selecting the first Company.

### Dashboard, `/admin/*` and `/cms` host decision

Move all authenticated dashboard and CMS surfaces to `admin.nrlaunch.com` in this sprint:

- Platform Admin: `admin.nrlaunch.com/admin/*` and `admin.nrlaunch.com/cms`.
- Company Admin: `admin.nrlaunch.com/dashboard/*`, with tenant scope derived from the authenticated
  membership and a server-validated selected tenant.
- Public websites remain on tenant subdomains only.

This avoids requiring Platform Admin to visit a client website and avoids duplicating CMS behavior per
tenant template. It changes session behavior: use an admin-host-only session cookie, do not rely on a
public tenant subdomain cookie, and validate every selected tenant against the user's active
membership. Platform Admin may select either tenant; Company Admin may select only its own tenant.
Do not use a broad `.nrlaunch.com` authentication cookie unless a separate security review proves that
cross-subdomain exposure is necessary and safe. Login redirects must return to `admin.nrlaunch.com`.

### DNS and future custom-domain compatibility

Configure:

- `nrlaunch.com` as a separate Vercel domain.
- `www.nrlaunch.com` as a separate Vercel domain/redirect.
- `*.nrlaunch.com` pointing to Vercel with wildcard TLS.
- `admin.nrlaunch.com` covered by the Vercel project and TLS certificate.

Use a routing abstraction that can later resolve a verified exact custom domain such as
`ir.customercompany.com` through a domain-mapping record. Do not encode the assumption that every
tenant is always a child of `nrlaunch.com`, but do not build customer-domain provisioning now.

## 4. Tenant #2 Fictionalization Plan

### Reference boundary

The supplied Allied Critical design is a structural reference only. The page structure named in the
brief is: Homepage, About, Projects, Investors, Newsroom, Contact and a project detail page. The
reference URL was not machine-readable in this planning pass, so the visual acceptance check must be
performed by Cursor in a browser before implementation. No Allied Critical identity or fact is an
approved source.

Allied Critical Metals Inc is unaffiliated with this project. Do not copy or adapt its company name,
legal name, wordmark, logo, ticker, exchange, project names, technical facts, financing, ownership,
management, biographies, photography, colors or typography.

### Fictionalization checklist

For Veylithra Tungsten Corp. replace all reference-specific material with invented material:

- legal/display name, wordmark and original logo;
- ticker, exchange and all listing facts;
- project names; use newly coined names unrelated to Borralha, Vila Verde, Santa Helena or Venise;
- every headline, news body, number, grade, width, intercept, resource statement and corporate fact;
- management and board names and biographies;
- photography and all recognizable brand styling;
- ownership, financing, listing, jurisdiction detail and technical source references.

Invented technical content must be plausible, clearly labeled fictional demo content and never copied
from a real issuer's disclosure. Use fictional `.example` source links or clearly marked demo documents.
Complete the same registry/ticker clearance gate for Veylithra and its projects.

### Population target

Populate Veylithra across every supported content family: company profile, two projects, flagship
project, listings, highlights, catalysts, news, documents, people, share structure, exploration
content, contact information and at least one private fictional PDF/media record. Include Published
and non-Published records so the live isolation tests have meaningful disclosure to protect.

## 5. Template Decision And ADR-0002 Reconciliation

ADR-0002 chose Explorer first; it did not require Explorer to remain the only template forever. Sprint 6
adds exactly one second presentation template, `summit`, while keeping Explorer as the primary demo
template for Qelvarion and the baseline regression surface.

`summit` is a presentation layer, not a second authorization or data model. It must reuse:

- server-side tenant resolution;
- published-only public data helpers and serializers;
- Draft → Review → Published status-only approval;
- private media authorization;
- provenance and reviewer metadata minimization;
- shared accessibility, SEO and error-state contracts.

The template selector must fail closed for an unknown key. It may use `Companies.brandColors` for
tenant-level branding, but layout/typography differences that cannot be safely expressed by theme
tokens belong in the template component, not in arbitrary tenant content.

## 6. Marketing Site Design

The apex `nrlaunch.com` is a platform-level marketing and demo-request site, not a tenant website.
It must not resolve a Company, use `DEFAULT_TENANT_SLUG`, expose tenant records or share a tenant's
brand identity. It should be a restrained B2B SaaS site for junior mining company decision-makers,
with the usable product experience visible early rather than a generic agency landing page.

### Marketing information architecture

- Homepage: Mining IR Platform identity, concise promise, product interface preview and primary
  request-demo action.
- Product: structured investor websites, self-service CMS, templates and publishing workflow.
- For Mining Companies: company website, projects, news, documents, management, share structure and
  disclosure review.
- Trust/Security: tenant isolation, private media, human approval, deployment and operational
  controls; do not make unsupported compliance or investment claims.
- Templates: original Explorer and Summit previews using clearly fictional content; never show a
  real tenant's private or unpublished data.
- Request a Demo: external contact route or a minimal platform-owner contact path; no investor PII,
  company onboarding or billing workflow in Sprint 6.

### Marketing visual direction

Use an original, credible mining-technology identity: geological linework or a restrained aerial
resource image may support the first viewport, but the page must foreground the actual product UI and
platform name. Use a distinct palette and typography from the Allied Critical reference. Do not trace,
recolor or reuse its logo, photography, wordmark, layout styling or content. The page should show a
hint of the next section on desktop and mobile, keep sections unframed rather than nesting cards,
and use the existing project design system conventions.

Marketing acceptance evidence:

- Apex and `www` render the marketing site in a browser and never resolve tenant data.
- The primary CTA has a defined destination and does not create investor or customer records.
- Tenant previews use fictional, published demo content only.
- No reference-site identity, retired fixture identity, tenant internal field or unpublished content
  appears in rendered HTML, metadata or client output.
- Responsive, loading, error and no-JavaScript/failure behavior is observed on desktop and mobile.

## 7. Page And Route Map

| Reference design page | Platform route | Status | Decision |
| --- | --- | --- | --- |
| Homepage | `/` on each tenant host | Existing, re-themed | Qelvarion remains Explorer; Veylithra uses `summit` |
| About | `/about` on tenant host | New route | Add a real tenant-scoped page; `/corporate` may remain a compatibility redirect or placeholder only if documented |
| Projects | `/projects` | Existing | Populate and verify published-only list |
| Project detail | `/projects/[slug]` | Existing | Add Veylithra project detail and technical source affordances |
| Investors | `/investors` | Existing placeholder | Wire listings, share structure, highlights, documents and risk-aware demo copy; no investor accounts or market data |
| Newsroom | `/news` and `/news/[slug]` | Existing | Replace placeholder behavior with tenant-scoped published news |
| Contact | `/contact` | Existing placeholder | Render tenant IR contact details; no public submission/PII workflow in Sprint 6 |
| Platform Admin | `admin.nrlaunch.com/admin/*` | Existing path, host change | Directly accessible to Platform Admin only |
| Company dashboard | `admin.nrlaunch.com/dashboard/*` | Existing path, host change | Tenant selected from server-validated membership |
| CMS | `admin.nrlaunch.com/cms` | New host alias/entry | Must not depend on visiting a tenant website |

The supplied reference also names a project detail page (`Borralha-Project.dc.html`). Map it only to
the generic `/projects/[slug]` route; no reference project name may enter code, seed data or docs.

## 7. Content Mapping And Gaps

| Design section | Collection/data source | Gap or implementation note |
| --- | --- | --- |
| Hero/company positioning | `companies` | Use published company fields and fictional copy; no real claims |
| About/mission | `companies` | Existing description/thesis fields may be sufficient; add `/about` composition |
| Project cards/detail | `projects`, `exploration-contents`, `documents` | Enforce same-tenant relationships and published-only reads |
| Investor highlights | `investment-highlights` | Existing collection; add negative fixture and public serializer coverage |
| Listings strip | New `company-listings` | Replaces single ticker/exchange limitation |
| Share structure | `share-structures` | Source required for material figures; fictional data only |
| Newsroom | `news-releases` | Existing collection and review workflow |
| Corporate presentation | `documents` and private `media` | Published reference only; direct storage remains private |
| Management/board | `people` | Fictional names/biographies and review state |
| Catalysts | `catalysts` | Existing collection; no predictions or investment advice |
| Contact | Company contact fields | Display only; no investor submission storage |
| Maps/location | Project coordinates and location summary | Existing map policy; text fallback and no new GIS provider |
| Footer/social links | Company `socialLinks` | Use fictional or platform-owned links, never reference-site links |

Unmapped content must be recorded as a gap, not silently invented during implementation.

## 8. Data Model Changes

### Multi-listing collection

The current Company model has one `tickerSymbol` and one `exchange`. Add a tenant-scoped
`company-listings` collection with:

- `tenant` relationship, server-scoped and immutable to Company Admin;
- `symbol`, normalized uppercase;
- `exchange`, `market`, optional `listingType` and `quoteCurrency`;
- `isPrimary`, `displayOrder`, active/publication status;
- source URL/source document for material listing facts;
- review metadata where the existing disclosure model requires it;
- unique constraint on `(tenant, symbol, exchange)` and at most one primary listing per tenant.

Migrate the existing Company ticker/exchange into one primary listing for every active tenant. Keep
the old fields temporarily as read-only compatibility fields or remove them only with a documented
forward migration and code-wide update. Do not silently create three listings from reference data.

### Routing fields

Make `subdomain` normalized, unique and Platform Admin-controlled. If the current field cannot support
the uniqueness and reserved-label rules, add a migration-backed routing/domain mapping model with a
unique normalized host key. Keep future custom domains representable as a separate mapping type, but
do not activate that type in Sprint 6.

### Migration strategy

- Generate every Payload migration in the same commit as the schema change.
- Test upgrade from the current Sprint 5 schema on a non-Production database.
- Record forward migration, rollback/forward-recovery decision and migration-drift output.
- Apply to Production only with `npm run migrate`, after backup/restore evidence.
- Never run `seed:reset` against Production.

## 9. Ordered Work Breakdown

| ID | Work | Rationale | Files/areas | Migration | Risk | Acceptance criterion |
| --- | --- | --- | --- | --- | --- | --- |
| S6-01 | Clear names/tickers and document evidence | Prevent real-issuer identity collision | Sprint 6 handoff, seed/docs inventory | No | High reputational/disclosure risk | Registry evidence table is complete before active seed changes |
| S6-02 | Rename active fixtures and preserve historical evidence | Remove real names without falsifying audit history | Seed, tests, env, living docs, active ADRs | Data update only unless schema constraints change | Medium | Retired-term script passes outside allowlist; rendered output is clean |
| S6-03 | Define hostname and CMS ADR | Resolve conflicts with current tenant fallback behavior | ADR-0016, architecture/security/deployment docs | No | Critical tenant-isolation risk | ADR accepted and routing contract test matrix exists |
| S6-04 | Implement fail-closed resolver | Unknown subdomains must not serve a real tenant | `src/lib/tenant.ts`, routing helpers, middleware/layouts | Maybe, for normalized routing uniqueness | Critical isolation risk | Repeated browser/API tests show typo host never renders either tenant |
| S6-05 | Configure apex, www, wildcard and admin DNS/TLS | Make real hostname behavior observable | Vercel, Cloudflare/registrar, deployment docs | No | High go-live risk | DNS, Vercel verification, wildcard TLS and browser observations recorded |
| S6-06 | Move authenticated surfaces to admin host | Direct CMS access and predictable session boundary | layouts, login redirects, dashboard/admin/cms entry points | No | High auth/session risk | Company Admin and Platform Admin role matrix passes on admin host |
| S6-07 | Define `summit` contract and visual mapping | Reconcile ADR-0002 while proving two templates | ADR-0017, Companies, template components, design docs | If template option schema changes | High shared-serializer risk | Two hosts render distinct templates using the same published data contract |
| S6-08 | Add About and wire reference page structure | Close route/content gaps deliberately | frontend routes, public-data helpers, design docs | No | Medium public exposure risk | Route map pages work in browser for both tenants |
| S6-09 | Add multi-listing model | Support more than one ticker/exchange correctly | new collection, Company migration, serializers, forms | Yes | High material-fact risk | Existing listing migrates as primary; multiple listings render only when Published |
| S6-10 | Build Veylithra fictional fixture module | Avoid one-tenant seed assumptions and prove second shape | `src/seed/`, fixture data, media, tests | Maybe data only | Critical isolation risk | Idempotent population creates all required content without reset |
| S6-11 | Execute Preview and Production promotion | Production must be observed at the actual layer | Vercel/Supabase/env/runbooks | Yes, migrate only | Critical operational risk | Exact commit is live on Production with project identity and guard evidence |
| S6-12 | Independent review and go-live decision | Verify evidence, not assertions | handoff/review record | No | Critical release risk | No open Critical/High issue and Product Director signs promotion |

## 10. Go-Live Runbook

### Pre-cutover

1. Close Sprint 5 review conditions and record exact commit SHA.
2. Complete name/ticker clearance and rename verification.
3. Repair Vercel Preview and verify its database project is staging.
4. Apply/test migrations against a non-Production copy; run migration drift.
5. Configure `nrlaunch.com`, `www`, wildcard `*.nrlaunch.com`, `admin.nrlaunch.com` and wildcard TLS.
6. Verify Production variables separately with `npm run check:env`; do not infer from local files.
7. Confirm Production project is `bwftfsfbiyzgwztwtqmh`, TLS CA is configured, and
   `PAYLOAD_DATABASE_PUSH=false` or absent. The deployed database guard can infer CA presence and
   that push is not `true`, but cannot prove the PEM contents or distinguish false from absent.
8. Take/verify a Production backup and perform a restore rehearsal against a non-Production target
   **before** loading real content. Staging rehearsal evidence does not substitute for this step.

### Cutover

1. Deploy the exact reviewed commit to Vercel Production.
2. Run `npm run migrate`; never use Payload push and never use `seed:reset`.
3. Load cleared fictional smoke data additively/idempotently: Qelvarion, Zenthoriq poison fixture and
   Veylithra. No customer content yet.
4. Verify apex marketing site, `www`, both tenant sites, Zenthoriq isolation, admin login, role
   boundaries, Published-only output and private media in a browser and at the storage boundary.
5. Repeat hostname requests after redeploy and from a cold browser session.
6. Record deployment ID, commit, domain verification, DNS/TLS observations, Supabase project,
   migration output, smoke data identifiers and all not-verified items.
7. Keep customer content blocked until Product Director promotion approval.

### Rollback

- Revert Vercel to the last known-good deployment while preserving the reviewed database schema.
- If DNS is faulty, remove/repair the affected domain mapping without pointing unknown hosts at a
  tenant fallback.
- Do not roll back a database migration destructively without a reviewed forward-recovery plan.
- Disable or unpublish fictional tenants if routing or serializer isolation is uncertain.
- Preserve logs, deployment IDs, migration output and the failed evidence; do not rewrite the record.

## 11. New ADRs Required

| ADR | Decision |
| --- | --- |
| ADR-0016 | `nrlaunch.com` apex/www behavior, exact subdomain routing, reserved hosts, fail-closed unknown-host behavior, local-only `DEFAULT_TENANT_SLUG`, and future custom-domain representation |
| ADR-0017 | `summit` template contract, shared data/auth/public serializer boundary, theme versus template responsibilities, and fail-closed unknown template behavior; reconcile ADR-0002 |
| ADR-0018 | Admin-host session boundary, Company Admin tenant selection, Platform Admin scope, host-only cookie strategy and login redirects |
| ADR-0019 | Multi-listing data model, primary listing migration, uniqueness and publication/source rules |
| ADR-0020 | Production cutover, backup/restore rehearsal, fictional smoke data, rollback and customer-content promotion gate |
| ADR-0021 | Fictional fixture identity clearance and historical evidence allowlist |

Do not mark an ADR accepted merely because a file exists; record the Product Director decision and
the evidence that the implementation matches it.

## 12. Test Plan

### Two-tenant isolation matrix

Run the matrix for Qelvarion, Veylithra and the Zenthoriq poison fixture:

| Surface | Same tenant | Other tenant | Anonymous/public |
| --- | --- | --- | --- |
| Company/project/content read | Allowed by role/status | Denied/empty without existence leak | Published same-host tenant only |
| Create/update/delete | Authorized membership only | Denied | Denied |
| Draft/Review/Archived | Dashboard reviewer only | Denied | Never present |
| Published technical content | Source/review rules | Never visible cross-tenant | Published serializer only |
| Media | Private authorized path | Denied | Published referenced path only |
| Provenance/reviewer fields | Authorized reviewer only | Denied | Stripped |
| Related project/source document | Same tenant only | Reject relation | No internal relation leakage |
| Listings | Same tenant, source/review rules | Denied | Published listing only |

Each public surface must include a negative fixture that would visibly leak if tenant scoping failed:
Veylithra content must not appear on Qelvarion, Qelvarion draft content must not appear on Veylithra,
and Zenthoriq poison content must not appear on either.

### Hostname matrix

Automated resolver tests and deployed browser tests must cover apex, `www`, both tenant hosts, poison
host, admin host, typo host, reserved labels, unknown parent domains, mixed case, trailing dots,
ports, inactive/unpublished tenants, missing local fallback and spoofed tenant headers.

For timing-sensitive deployment behavior, repeat each key host check after redeploy and from a cold
browser session. Static HTML or one successful curl is insufficient evidence.

### Required verification layers

- `npm run verify` on the exact committed release candidate.
- Database migration and drift output.
- Deployed environment observation using `npm run check:env` and database guard behavior.
- Browser evidence for route, auth, responsive and template claims.
- Storage endpoint/application-path evidence for private media claims.
- Rendered output scan for retired identities and unauthorized content.
- DNS, Vercel domain verification, TLS and Supabase project identity evidence.

## 13. Exit Criteria

Sprint 6 is complete only when:

- Sprint 5 independent review is closed with no open Critical/High finding or explicit Product
  Director acceptance.
- Qelvarion, Zenthoriq and Veylithra names/tickers pass the documented registry-clearance gate.
- Active source, tests, seed, living docs and rendered output contain no retired terms; the historical
  allowlist is bounded and verified.
- `nrlaunch.com`, `www`, wildcard tenant domains, `admin.nrlaunch.com` and wildcard TLS are verified.
- Apex/www serve the platform site and never resolve to a tenant.
- Qelvarion, Veylithra and the poison fixture resolve only by their exact tenant subdomains.
- An unknown or mistyped subdomain returns controlled 404/setup behavior and never serves a real
  tenant.
- `DEFAULT_TENANT_SLUG` is absent from deployed Preview/Production and local-only fallback behavior
  is tested explicitly.
- Admin/CMS is directly reachable on `admin.nrlaunch.com`; host-only sessions and membership-based
  tenant selection pass the role matrix.
- Explorer and `summit` render two meaningfully different, fully populated fictional tenants.
- Reference page structure is mapped and About/Investors/Newsroom/Contact gaps are either implemented
  or explicitly deferred in the route map.
- Multi-listing migration and public/source/review behavior pass without losing existing fields.
- Production is cut over to `bwftfsfbiyzgwztwtqmh` with migrations only, fictional smoke data first,
  verified backup/restore rehearsal and no destructive reset.
- All Sprint 1-5 isolation, publication, provenance, media and public-API gates still pass.
- `npm run verify` passes on the exact committed release candidate.
- Independent review has verified deployed behavior at the browser, storage, DNS and database layers.
- Product Director has signed the customer-content promotion decision.

## 14. Independent Review Handoff

Give the reviewer the exact commit SHA, deployed Production and Preview URLs, Vercel deployment IDs,
Supabase project IDs, DNS/TLS observations, migration output, backup/restore evidence, fixture-clearance
record, retired-term scan output, changed files, ADRs, test output, browser screenshots/recordings and
all not-verified items.

Use this request:

> Review Sprint 6 against `AGENTS.md`, `docs/SPRINT6_HANDOFF.md`, `docs/SPRINT5_REVIEW.md`,
> `docs/SPRINT5_HANDOFF.md`, `docs/SPRINT4_REVIEW.md`, `docs/SPRINT3_REVIEW.md`,
> `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/SECURITY.md`, `docs/TESTING.md`,
> `docs/OPERATIONS.md`, `docs/DEPLOYMENT.md`, ADR-0002, ADR-0004, ADR-0008, ADR-0013 and the
> Sprint 6 ADRs. Follow ADR-0008's Evidence Standard. Prioritize the unknown-host fallback defect,
> apex/www/admin routing, host-only session behavior, local-only `DEFAULT_TENANT_SLUG`, two-tenant
> isolation, Published-only public reads, private media, provenance minimization, multi-listing
> migration, fictionalization scan, reference-page route mapping, new-template fail-closed behavior,
> Production project identity, backup/restore evidence and rollback. Verify browser behavior at the
> deployed URL and storage/privacy claims at the storage boundary. Repeat timing-sensitive checks.
> Classify findings as Critical, High, Medium or Low with reproduction steps, affected files/routes,
> evidence and recommended fixes. Do not recommend customer content while a Critical or High finding
> remains open.

## Completion Report

Cursor or the implementing engineer must append evidence here before Sprint 6 is marked complete:

- ADRs created: ADR-0016, ADR-0017, ADR-0018, ADR-0019, ADR-0020, ADR-0021
- Migration: `20260821_030052_sprint6_company_listings` (+ `.json` snapshot); local migrate applied 2026-08-21
- Fixture rename: Qelvarion / Zenthoriq / Veylithra; `npm run check:retired-fixtures` wired into `npm run verify`
- Hostname: fail-closed classifier in `src/lib/host.ts`; www→apex owned by Vercel Domains (not middleware); auth-surface redirect to `admin.nrlaunch.com`
- Templates: `explorer` + `summit` via `templateKey`; shared serializers unchanged
- Marketing: apex `MarketingHome` (no tenant resolution)
- Routes: `/about` added; `/investors` and `/contact` wired to Published data; `/corporate` → `/about`
- Commit SHA: *(fill after commit)*
- Preview / Production URLs, DNS/TLS, Supabase cutover: **Not verified in this implementation session** — requires operator Vercel/DNS work per go-live runbook
- Independent review: **Pending**
- Known limitations: Production cutover, wildcard TLS, staging/Production seed populate, and deployed browser matrix remain operator steps; do not mark Sprint 6 Done without them
