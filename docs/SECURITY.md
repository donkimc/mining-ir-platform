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

Technical mining disclosure cannot move directly from draft or AI-assisted content to Published. A server-validated review action records reviewer identity and timestamp. Machine-assisted drafts (ADR-0012) additionally require source-verification acknowledgement. Sprint 5 does not send unpublished documents to external AI providers (ADR-0013).

## Maps and third-party requests

The OpenStreetMap embed requires CSP `frame-src https://www.openstreetmap.org`. Loading the embed discloses the visitor’s IP/request metadata to OSM operators; see ADR-0010. Text location remains available without the iframe.

## Secrets and Data

Keep secrets in environment variables. Provide `.env.example` with names only. Do not commit real credentials, private keys or production data. Do not publish literal seed passwords in Markdown. Validate URLs and user-provided rich text according to the selected CMS safeguards. Never log document bytes or raw source excerpts.

## Security Verification

Test unauthenticated access, wrong-tenant access, role boundaries, published-only reads, mutation tenant ownership and review-gated publication.

## Selected Auth Integration (Sprint 1)

- Provider: Payload CMS built-in authentication on the `users` collection.
- Session: httpOnly `payload-token` cookie set by `/api/users/login` (and the `/login` server action fallback).
- Cookie `Secure` follows the request protocol (`x-forwarded-proto` / `NEXT_PUBLIC_SERVER_URL`), not merely `NODE_ENV`.
- Dashboard/admin auth reads the token via Next `cookies()` and authenticates with `Authorization: JWT …` so App Router soft navigations do not drop the session.
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

## Sprint 3 Release Hardening

- The Supabase Storage bucket used by Payload media must be private. A correct application route is not sufficient if the underlying object URL remains public.
- Verify both paths for every sensitive fixture: the authorized application route and the direct object URL. Draft, Review, wrong-tenant and unauthenticated requests must not return bytes.
- Rotate any secret that has appeared in review output, commits, logs or shared documents. Invalidate existing sessions after rotating the session secret and verify the old secret no longer authenticates.
- Preview and Production database connections must use certificate verification with a configured CA (`DATABASE_SSL_CA`). `DATABASE_SSL_REJECT_UNAUTHORIZED=false` and `ALLOW_INSECURE_DB_SSL` are not valid deployment workarounds (Sprint 3 removed the hatch).
- Production must reject schema auto-push, missing migration configuration and missing required secrets. Any emergency override must be temporary, documented, audited and unavailable by default.
- Anonymous API responses must use the public serializer (`stripReviewMetadataAfterRead` / `serializeAnonymousPublicDoc`). Never return reviewer IDs, review timestamps, membership data, draft existence or unrelated tenant records.
- Anonymous serializers also strip tenant relation IDs and platform routing fields (`websiteDomain`, `subdomain`, `templateKey`).
- Anonymous `GET /api/companies` returns only the **resolved** published tenant (never a multi-tenant directory). Platform Admins retain cross-tenant listing.
- Rotate exposed session secrets and verify old JWTs fail; see [OPERATIONS.md](./OPERATIONS.md).
- Do not call a security control verified until the test uses a real cloud object or a reproducible infrastructure assertion; a zero-file staging test proves only that no file was tested.
