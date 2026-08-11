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

