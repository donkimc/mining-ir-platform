# Security

## Authentication

Use the selected auth integration documented by the implementation. Sessions must identify the user server-side. Public Investor routes require no login; dashboard and admin routes require an authenticated session.

## Authorization

- Company Admin access requires an active membership for the requested tenant.
- Platform Admin access requires an explicit platform role.
- Every private read and write checks authorization on the server.
- Tenant IDs from browser input are hints only; derive or validate tenant scope from the session and membership.
- Prevent Company Admin updates from changing tenant ownership or role.

## Public Data

Public queries filter by tenant and `Published` status. Draft, Review and Archived content must not appear in public HTML, JSON, metadata or error messages.

## Disclosure Review

Technical mining disclosure cannot move directly from draft or AI-assisted content to Published. A server-validated review action records reviewer identity and timestamp. Sprint 1 may use a manual admin action; automation is later scope.

## Secrets and Data

Keep secrets in environment variables. Provide `.env.example` with names only. Do not commit real credentials, private keys or production data. Validate URLs and user-provided rich text according to the selected CMS safeguards.

## Security Verification

Test unauthenticated access, wrong-tenant access, role boundaries, published-only reads, mutation tenant ownership and review-gated publication.

## Selected Auth Integration (Sprint 1)

- Provider: Payload CMS built-in authentication on the `users` collection.
- Session: httpOnly `payload-token` cookie set by the `/login` server action.
- Platform Admin: `users.platformRole = platform_admin` checked server-side.
- Company Admin: active `tenant-memberships` row with `role = company_admin`.
- Local-only seed users are documented in README; do not use them in production.

## Sprint 2 Content Security

- News, Documents, People, Share Structures and Exploration records are tenant-owned.
- Company Admin actions derive tenant scope from the active membership.
- Public endpoints and page loaders use tenant plus Published filters at query time.
- Source URLs are validated and rendered safely; do not trust user-provided HTML or URLs outside the CMS validation path.
- Reviewer identity and timestamps are server-derived, not accepted from browser input.
- A Published record's disclosure-sensitive fields cannot be changed without a new review cycle.
- Approval is status-only and cannot include content edits in the same mutation.

## Sprint 2 Threat Checks

Test wrong-tenant IDs, wrong-tenant related projects/documents, forged reviewer fields, direct Published creates, Published edits, Review-to-Published content edits, public API enumeration and draft content in metadata.

## Media and Storage

- Serve uploads only through Payload (`/api/media/file/<uuid-prefixed-name>`) with `Media.access.read` enforced.
- Anonymous media reads require a Published Document `file` or Person `headshot` on a published active tenant.
- Do not emit public Supabase object URLs. Keep the storage bucket private.
- Object keys are UUID-prefixed; `originalFilename` is for display only.
