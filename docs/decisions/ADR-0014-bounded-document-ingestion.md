# ADR-0014: Bounded Document Ingestion and Automation Boundary

## Status

Accepted for Sprint 5 (2026-08-18).

## Context

Automation needs a safe write path into private Media. A second upload pipeline or bulk crawler would expand the attack surface before single-document controls are proven.

## Decision

1. Ingestion is **manual and bounded**: an authenticated Company Admin uploads one PDF/technical report into an **existing** tenant Document.
2. Reuse the existing Payload Media + private Supabase Storage path (UUID-prefixed object keys, tenant ownership, published-reference anonymous access).
3. Allowed types: `application/pdf` only. Maximum size: **10 MiB**.
4. Tenant scope is derived server-side from the session membership, never from a client-supplied tenant ID alone.
5. Uploads attach as Draft-related media until the Document is published through the existing human review workflow. Draft/Review/unreferenced objects are not anonymously downloadable.
6. Failed validation or failed persistence must not leave an anonymously readable orphan.
7. Bulk ingestion, crawlers, queues, retries-as-a-service, email ingestion and SEDAR+ are **out of scope**.
8. Ingestion never auto-publishes and never calls an external AI provider (ADR-0013).

## Consequences

- Dashboard Document edit gains a dedicated upload action separate from content edit and status change.
- Wrong-tenant attach/read remains denied by existing Media/Document access controls.
- Future queue-based automation requires amending this ADR.
