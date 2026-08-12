# ADR-0006: Sprint 2 Mining Content Workflow

## Status

Accepted for Sprint 2 implementation

## Decision

Extend the existing Payload/Postgres tenant-aware content model with News Releases, Documents/Presentations, Management Profiles, Share Structure and Exploration Content. All content uses a shared Draft, Review, Published and Archived lifecycle.

Disclosure-sensitive content is edited separately from approval. A Published record cannot be silently rewritten; material edits require a new review cycle. Approval is a server-side status-only action that records reviewer identity and timestamp.

## Consequences

The dashboard needs consistent list, form and review controls across collections. Public Explorer pages must query only Published records with tenant scope. Every collection requires tenant isolation, publication and review-gate tests. AI extraction and automatic publication remain future work.
