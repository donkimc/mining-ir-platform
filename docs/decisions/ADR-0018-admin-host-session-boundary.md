# ADR-0018: Admin Host Session Boundary

## Status

Accepted — Product Director 2026-08-20.

## Context

Serving dashboard and CMS from tenant public hosts couples Platform Admin to client websites and complicates session scope across subdomains.

## Decision

1. Authenticated surfaces live on `admin.nrlaunch.com`:
   - Platform Admin: `/admin/*`, `/cms`
   - Company Admin: `/dashboard/*`
2. Public websites remain on tenant subdomains only.
3. Session cookies are **host-only** on `admin.nrlaunch.com` (no `Domain=.nrlaunch.com`) unless a future separate security review proves cross-subdomain cookies are necessary and safe.
4. Login redirects return to `admin.nrlaunch.com` paths.
5. Tenant scope for dashboard actions is derived from authenticated membership (and Platform Admin role), never from a browser-supplied tenant ID alone. Platform Admin may select either tenant; Company Admin may select only its own.

## Consequences

- Logging in on a tenant public host does not authorize dashboard access on admin without a new admin-host session.
- Localhost and Preview hosts keep documented non-Production behavior for single-host development.
