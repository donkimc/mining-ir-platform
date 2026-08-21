# ADR-0016: nrlaunch.com Hostname Routing And Fail-Closed Tenant Resolution

## Status

Accepted — Product Director decisions 2026-08-20; implementation Sprint 6.

## Context

Sprint 1–5 resolved tenants with a first-label subdomain heuristic and fell back to `DEFAULT_TENANT_SLUG` on unknown hosts. That fallback can serve a real tenant for a mistyped hostname and has never been proven on `nrlaunch.com`.

## Decision

1. **Apex** `nrlaunch.com` serves the platform marketing site. It never resolves a Company and never uses `DEFAULT_TENANT_SLUG`.
2. **`www.nrlaunch.com`** redirects to the apex (or serves the same marketing site). It never resolves a tenant.
3. **Tenant sites** resolve only when the host is exactly `<normalized-subdomain>.nrlaunch.com` and the matching Company is active and Published. Demo companies are ordinary tenants; there is no `demo.` subdomain.
4. **`admin.nrlaunch.com`** is the Platform Admin / CMS / dashboard host. It does not resolve a public tenant.
5. **Reserved labels** (`www`, `admin`, `app`, `api`, `cms`, `demo`, `staging`, `preview`, `mail` and the apex) are never tenants.
6. **Unknown / typo hosts** (including `typo.nrlaunch.com`) return controlled 404/setup behavior. Never fall back to a tenant after an `nrlaunch.com` host has been recognized.
7. **`DEFAULT_TENANT_SLUG`** is local-development and script-only. It must be absent from Vercel Preview and Production. Local fallback is allowed only when `NODE_ENV !== 'production'` and the request is not a recognized `nrlaunch.com` host.
8. **Custom customer domains** remain out of scope, but routing abstractions must allow a future exact-host mapping type without assuming every tenant is always a child of `nrlaunch.com`.

## Consequences

- Tests inject hosts or resolver inputs rather than ambient defaults on deployed environments.
- Historical Sprint 1–5 docs that describe the old fallback remain historical evidence (see ADR-0021).
