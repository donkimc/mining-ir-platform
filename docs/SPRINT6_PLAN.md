# Sprint 6 Plan - Real-Domain Go-Live

## Status

**Planning only. No implementation is authorized by this document.**

Sprint 6 begins only after Sprint 5 independent review is closed or the Product Director has
explicitly accepted every remaining condition. The current Production database is schema-migrated
but empty, and the Vercel Production alias still points at the Supabase staging project. This sprint
must not be described as a customer-ready launch until the promotion gates in this document pass.

## Goal

Prove that the platform can serve two differently shaped, fully fictional mining companies on
`nrlaunch.com`, using server-side hostname tenant resolution, two templates, the real Production
Supabase project and a separately reachable Platform Admin workspace.

The sprint has four outcomes:

1. Replace the current fixture identities with registry-checked, coined fictional identities.
2. Route tenant websites by controlled subdomains of `nrlaunch.com`.
3. Cut the reviewed release candidate from staging to the real Production database without schema
   push or destructive reseeding.
4. Populate a second tenant and exercise the new template, public site, dashboard and isolation
   controls in a deployed browser session.

## Product Decisions For This Plan

These decisions are approved by the Product Director on 2026-08-20. They must still be recorded in
the Sprint 6 ADRs before implementation.

| Area | Sprint 6 decision | Reason |
| --- | --- | --- |
| Apex domain | `nrlaunch.com` is the platform marketing/demo entry point, not a tenant | Avoid silently assigning the root site to whichever tenant happens to be the default |
| Tenant websites | `<subdomain>.nrlaunch.com`, for example `qelvarion.nrlaunch.com` and `veylithra.nrlaunch.com` | Makes tenant identity visible and testable at the HTTP boundary |
| CMS | `admin.nrlaunch.com` is the Platform Admin entry point; authenticated Company Admins use the existing dashboard path | Platform Admin should not need to visit a client website to reach CMS controls |
| Reserved hosts | `www`, `admin`, `app`, `api`, `cms`, `demo`, `staging`, `preview`, `mail` and the apex are unavailable as tenant subdomains | Prevent host collisions and accidental exposure of internal routes |
| Unknown hosts | Return a controlled 404 or setup page; never fall back to a tenant in deployed Production | A fallback can cross the tenant boundary while appearing successful |
| Custom client domains | Out of scope for this sprint; first-party `nrlaunch.com` subdomains are the launch proof | Custom-domain verification and certificate lifecycle deserve a separate design and review |
| External AI | Remains prohibited by ADR-0013 | This sprint is about identity, routing and go-live evidence, not extraction |

Custom client domains remain outside Sprint 6. Do not let Cursor infer a different domain policy from
a hostname string.

## Part 1 - Rename Fixture Identities First

### Approved working names, pending formal clearance

The Product Director approved these deliberately coined working names. They are not yet legally
cleared; the required SEDAR+, EDGAR and relevant registry checks remain a pre-implementation gate.

| Role | Approved working name | Slug | Fictional ticker |
| --- | --- | --- | --- |
| Primary demo tenant | Qelvarion Resource Corp. | `qelvarion-resource` | `QVRN` |
| Isolation fixture | Zenthoriq Resource Ltd. | `zenthoriq-resource` | `ZQRI` |
| Second tenant | Veylithra Tungsten Corp. | `veylithra-tungsten` | `VYTH` |

Retired prior fixture identities and the rename mapping are recorded in ADR-0021 (not repeated here so living docs stay free of retired tokens).

Before any name is committed, verify each legal/display name, slug, ticker and project name against
SEDAR+, EDGAR and the relevant company registry. Record the date, sources checked, search terms,
result and decision in a small evidence table in the Sprint 6 handoff. A name that merely sounds
invented is not evidence of clearance. Replace a working name if a conflict is found, and update
this table before implementation proceeds.

Use RFC 2606 `.example` domains for fictional websites. Use `.local` or `.staging` only for seed
account email addresses. Tickers must be fictional and must not match a listed issuer.

### Rename inventory

Search and update all of the following (not only the seed file):

- `src/seed/index.ts`: companies, projects, news, documents, people, share structure, exploration,
  highlights, catalysts, contacts, social links and seed account emails (`admin@qelvarion.local`).
- Negative fixtures and assertions: `ZENTHORIQ SECRET`, `ZENTHORIQ CATALYST SECRET`,
  `hollowspire-isolation`, and every active fixture string in `tests/`.
- `.env.example` and deployment environment values for `DEFAULT_TENANT_SLUG=qelvarion-resource`
  (local/Preview only).
- Living documents: `AGENTS.md`, `README.md`, `docs/ROADMAP.md`, `docs/PRODUCT.md`,
  `docs/DATA_MODEL.md`, `docs/DESIGN.md`, `docs/SECURITY.md`, `docs/TESTING.md`,
  `docs/DEPLOYMENT.md` and `docs/OPERATIONS.md`.
- ADRs and current Sprint 6 documentation that describe active fixtures.
- Fictional records in Supabase staging (`jthotkkremiesvocfsmr`) and any fictional records in
  Production (`bwftfsfbiyzgwztwtqmh`).

### Historical evidence policy

Do not rewrite Sprint 1-5 reviews or handoffs merely to replace quoted fixture values. Those values
are audit evidence for the behavior that was tested at the time. Add the historical terminology note
from ADR-0021 at the top of each affected historical document (exact wording lives there so this
living plan does not re-quote retired tokens).

This policy must be reconciled with the zero-occurrence gate below. A literal zero across every
tracked file is impossible while immutable historical evidence retains the retired strings. The
recommended implementation is an explicit, reviewed historical allowlist: current source, seed,
tests, living docs and rendered output must contain zero retired terms; only named historical review
and handoff files may contain them, and a separate check must prove the allowlist has not expanded.
The Product Director must accept this exception before the rename starts.

### Rename acceptance criteria

- Candidate identity clearance evidence is recorded before adoption.
- All active seed data, tests, environment examples and living docs use the cleared identities.
- No retired identity can be selected by a default seed or production environment.
- Existing historical evidence remains unchanged except for the mapping note.
- `npm run verify` includes the retired-term check and fails if a retired term appears outside the
  approved historical allowlist.
- Rendered public HTML, metadata and browser-visible JSON contain no retired terms.
- Database migration/update is reversible and preserves record relationships; no destructive reset is
  used against Production.

## Part 2 - `nrlaunch.com` Hostname Routing

### Routing contract

Implement and document a single server-side resolver with these rules:

1. Normalize the request hostname by lowercasing it, removing a trailing dot and handling the port
   separately.
2. Recognize the canonical apex, `www`, Platform Admin host and known deployment hosts explicitly.
3. For `<tenant>.nrlaunch.com`, resolve the first label against an active, published Company record
   whose normalized subdomain is unique.
4. Resolve the tenant before public data queries and pass the resolved tenant ID into every query.
5. Never trust a browser-supplied tenant ID or an arbitrary `Host` override. A development/test
   override must remain unavailable in Production unless it is authenticated by the existing trusted
   proxy mechanism.
6. Unknown, inactive, unpublished or reserved hosts return 404/controlled setup behavior and do not
   use `DEFAULT_TENANT_SLUG`.
7. Local development may retain `DEFAULT_TENANT_SLUG` as an explicit local-only fallback. Preview
   must use an explicit test host or trusted test override and must not be treated as Production
   evidence.
8. Tenant resolution must be shared by public pages, public APIs, metadata, media authorization and
   any server actions that use tenant context.

The implementation must preserve the existing published-only serializer and must not expose
`tenant`, `websiteDomain`, `subdomain`, `templateKey`, reviewer metadata or provenance in anonymous
responses.

### Domain and DNS setup

The deployment checklist must include:

- Add and verify `nrlaunch.com` in the Vercel project.
- Configure the apex and wildcard tenant domain according to the current Vercel domain
  instructions, with DNS managed at the registrar/Cloudflare account owned by the Product Director.
- Verify TLS for the apex, `www`, `admin` and at least two tenant subdomains.
- Keep Preview and Production domain configuration visibly separate.
- Add canonical redirects only after confirming that redirects do not turn an unknown host into a
  known tenant.
- Record DNS propagation, Vercel project/domain verification, deployment ID and browser observations
  in the Sprint 6 handoff.

### Host-routing data model

Use the existing Company `subdomain` field if it can be made safe. Otherwise add a migration-backed
normalized routing field or a domain-mapping collection. In either design:

- normalized subdomain is unique and server-controlled by Platform Admin;
- only RFC-safe lowercase labels are accepted;
- reserved labels are rejected;
- a tenant cannot claim the apex, an internal host or another tenant's label;
- inactive/unpublished tenants cannot resolve publicly;
- routing identity is separate from a user-editable company display name;
- future custom domains are not silently represented as subdomains.

## Part 3 - Second Tenant And New Template

### Template boundary

`Companies.templateKey` currently has only one option: `explorer`. Add a deliberate template
contract before adding the approved second option, `summit`. The name is a code identifier, not a
claim about the tenant, and still requires a documented visual specification.

The template contract must define:

- supported Company and content fields;
- navigation and route behavior;
- responsive layout and accessibility requirements;
- SEO title/description and canonical URL behavior;
- empty, loading, error, unauthorized and not-found states;
- which content is optional versus required;
- how the shared published-only data layer and public serializer are reused;
- a fail-closed behavior for an unknown template key.

Do not fork tenant authorization, publication rules, media authorization or serializers per template.
The template chooses presentation; the server chooses tenant and visibility.

### Veylithra Tungsten population checklist

After identity clearance, populate the second tenant with fictional, clearly labeled data across the
same content contract:

- Company profile, fictional ticker, jurisdiction, commodity and brand settings.
- At least two projects, including one flagship and one non-flagship project.
- Published and non-published Project records to prove the public boundary.
- News releases, documents, management profiles, share structure and exploration content.
- Investment highlights and catalysts where supported by the current schema.
- At least one fictional private PDF/media record and one unreferenced or unpublished media record.
- Source links or source-document references for technical/material claims; sources must also be
  fictional or clearly marked as demo material.
- A Company Admin membership that cannot access the first tenant.
- A Platform Admin membership that can manage both tenants through the separate admin entry point.

No real company claims, real issuer ticker, real investor data or investment recommendation may be
seeded. The new template must be exercised with content that differs meaningfully from the first
tenant, not just a second copy with a new logo.

## Part 4 - Production Promotion

### Required order

1. Close Sprint 5 independent review conditions and record the exact commit SHA.
2. Clear fixture identities and run the retired-term check.
3. Apply and verify any migration against a non-production copy first.
4. Deploy to a Vercel Preview backed by Supabase staging and test both tenant hosts in a browser.
5. Verify Production environment variables separately with `npm run check:env`; do not infer them
   from local files or Preview.
6. Confirm Production uses project `bwftfsfbiyzgwztwtqmh`, verified database TLS and
   `PAYLOAD_DATABASE_PUSH=false` or absent. Never run `seed:reset` against Production.
7. Run migrations only with `npm run migrate`; commit generated migration files and pass migration
   drift checks.
8. Load only cleared fictional smoke data into Production, using an idempotent or additive process.
   Do not use a destructive seed/reset command.
9. Point the Vercel Production deployment at Production and configure the `nrlaunch.com` domains.
10. Repeat the browser, API, media, authentication, routing and isolation checks against the live
    Production deployment.
11. Obtain independent review of the exact deployed URL and commit. No customer content is allowed
    before all Critical and High findings are closed or explicitly accepted by the Product Director.

### Environment safety gates

- Production and staging database project IDs are recorded and visibly different.
- Production has no staging-only `DEFAULT_TENANT_SLUG` behavior for deployed hostname requests.
- Production schema push is disabled or absent; migrations are the only schema path.
- Production TLS CA is configured and observed through a deployed DB-backed request plus the available
  environment check.
- No seed password, secret, provider key or document bytes appear in tracked docs, logs or output.
- A rollback plan identifies the previous Vercel deployment, database migration strategy and DNS
  rollback behavior before cutover.
- Customer content remains blocked until the Product Director signs the promotion record.

## Test And Evidence Plan

### Automated checks

Add focused coverage for:

- hostname normalization, ports, trailing dots, case, reserved labels and malformed labels;
- apex, `www`, admin, local, Preview and Vercel-host behavior;
- known tenant host resolves only its own published tenant;
- unknown, inactive and unpublished hosts do not fall back to a tenant;
- spoofed tenant headers and browser tenant IDs are rejected in Production;
- two tenants with different templates render only their own content;
- public HTML, metadata and APIs contain Published same-tenant content only;
- draft/review/archived records, provenance, reviewer fields and internal routing fields stay private;
- media references cannot cross tenants or bypass private storage authorization;
- the new template fails closed when its key is invalid or its tenant is disabled;
- all existing Sprints 1-5 regression and negative-tenant fixtures still pass;
- retired-term scan and historical allowlist check.

### Browser and infrastructure evidence

The review packet must include repeated browser observations, not only static HTML or a green test
suite:

- `https://nrlaunch.com` shows the platform entry point.
- `https://qelvarion.nrlaunch.com` and `https://veylithra.nrlaunch.com` show different tenants and
  templates, with no cross-tenant content.
- `https://admin.nrlaunch.com` requires authentication and exposes Platform Admin controls only to
  Platform Admins.
- An authenticated Company Admin can use the dashboard without visiting the public tenant site;
  another tenant's records are denied.
- Unknown and reserved hosts do not display a tenant website.
- Published media works through the authorized application path; Draft/Review/unreferenced and
  wrong-tenant media remain denied.
- Mobile and desktop layouts, loading/empty/error/forbidden/not-found states and canonical metadata
  are observed in the browser.
- DNS/TLS/Vercel domain verification, Supabase project identity, migration result, commit SHA and
  deployment ID are recorded.

Repeat hostname and public-content checks after redeploy and after a cold browser session. One
successful request is not sufficient evidence for timing-sensitive routing or deployment behavior.

## Sprint Backlog

| ID | Work item | Priority | Evidence required |
| --- | --- | --- | --- |
| S6-01 | Product Director clears or replaces all three coined identities and tickers | Blocker | Registry search record and accepted identity table |
| S6-02 | Preserve historical review evidence and add mapping notes/allowlist policy | High | Diff and historical-scan output |
| S6-03 | Rename active seed, tests, env examples, docs and deployed fictional data | Blocker | Zero-retired-term check outside approved history |
| S6-04 | Define ADR for hostname routing, reserved hosts and apex/admin roles | Blocker | Accepted ADR |
| S6-05 | Implement normalized server-side `nrlaunch.com` tenant resolution | Blocker | Unit, integration and deployed browser evidence |
| S6-06 | Configure Vercel, DNS, wildcard domain and TLS for apex/admin/tenant hosts | Blocker | DNS/Vercel/TLS observations |
| S6-07 | Define and implement the second template contract and `templateKey` option | High | ADR, UX spec, migration if needed, browser evidence |
| S6-08 | Populate the second tenant across all supported content families | High | Idempotent seed/import record and database evidence |
| S6-09 | Verify Platform Admin direct CMS access and Company Admin tenant boundaries | Blocker | Browser role matrix and negative tests |
| S6-10 | Promote reviewed commit to real Production without reset or schema push | Blocker | Environment, migration and deployment evidence |
| S6-11 | Run full regression, browser, storage and public-serialization review | Blocker | Exact-commit verification packet |
| S6-12 | Independent review and Product Director go-live decision | Blocker | Review report and signed promotion record |

## Definition Of Done

Sprint 6 is complete only when:

- Sprint 5 is independently reviewed with no open Critical/High finding or explicit Product Director
  acceptance for each exception.
- Fixture identities are registry-checked, fictional, consistently renamed and documented.
- The historical evidence exception is explicit, bounded and checked.
- `nrlaunch.com`, wildcard tenant domains and `admin.nrlaunch.com` are verified with TLS in Vercel.
- Hostname routing is server-side, normalized, tenant-scoped and fail-closed for unknown hosts.
- No deployed Production request uses a tenant fallback for an unrecognized hostname.
- Both fully populated fictional tenants render their own Published content and distinct templates.
- Company Admins can reach the CMS/dashboard directly and cannot cross tenants.
- Platform Admin can manage both tenants from the platform admin entry point.
- Production is connected to `bwftfsfbiyzgwztwtqmh`, with migrations applied, TLS verified and schema
  push disabled/absent. `seed:reset` was never run against Production.
- Private media, publication rules, provenance, serializer minimization and all prior isolation
  regressions pass in the live environment.
- `npm run verify` passes on the exact committed release candidate, including migration drift and the
  retired-term check.
- Browser evidence exists for apex, admin, both tenant hosts, unknown host, mobile/desktop and
  authentication states.
- The independent review has examined the deployed URL and the Product Director has explicitly
  decided whether to permit customer content.

## Explicit Non-Goals

- Custom client-owned domains and automated domain verification.
- Billing, subscriptions, self-service public signup or customer provisioning automation.
- Live market data, investor accounts, CRM, alerts or investor PII.
- External AI providers, AI egress, automatic publication or SEDAR+ integration.
- Advanced GIS, predictive analytics, technical interpretation or investment recommendations.
- A third production template beyond the existing Explorer and the single Sprint 6 template.
- Rewriting historical review evidence to make it look as though the new fixture names existed earlier.

## Required ADRs And Documentation

Before implementation, create or amend:

- ADR-0016: hostname-based tenant routing, canonical domains, reserved hosts and apex/admin roles.
- ADR-0017: multi-template contract and fail-closed template selection.
- ADR-0018: Production cutover, fictional smoke data and customer-content promotion gates.
- ADR-0019: fixture identity clearance and historical evidence preservation.

Update `AGENTS.md`, `README.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/DESIGN.md`,
`docs/SECURITY.md`, `docs/TESTING.md`, `docs/DEPLOYMENT.md`, `docs/OPERATIONS.md` and
`docs/ROADMAP.md` only as implementation decisions are actually completed. The Sprint 6 handoff
must state what was not verified rather than implying that DNS, Production or browser behavior was
checked when it was not.

## Open Decisions Before Cursor Starts

1. Complete formal registry clearance for the approved working names, or replace any conflicting
   name before implementation.
2. The apex is approved as the platform marketing/demo site and `admin.nrlaunch.com` as the direct
   Platform Admin entry point.
3. The second template key `summit` is approved.
4. The historical-document allowlist is approved; literal zero occurrences in every tracked file is
   incompatible with preserving quoted audit evidence.
5. Custom client domains are approved as outside Sprint 6.

## Cursor Handoff Prompt

Implement Sprint 6 only after reading `AGENTS.md`, this document, the Sprint 5 handoff/review and all
referenced ADRs. Treat this document as the acceptance contract. Do not invent identity, apex-domain,
template, custom-domain or AI-egress decisions. Stop and report if an open decision above is not
resolved. Work in small commits, generate migrations with schema changes, never run `seed:reset`
against Production, and keep the exact commit, changed files, commands, test results, deployment URL,
database project and not-verified items in `docs/SPRINT6_HANDOFF.md`. No customer content may be
loaded or marked ready until the Product Director approves the final promotion record.
