# ADR-0015: Reviewer Source-Verification Contract

## Status

Accepted for Sprint 5 (2026-08-18).

## Context

Reviewers approve plausible extraction errors when origin and source context are invisible. UI cannot guarantee technical correctness, but it can make source checking unavoidable before publication.

## Decision

1. For `machine_assisted` records in Review, the dashboard shows before approval:
   - Machine-origin badge
   - Source-document link (tenant-owned Document/Media)
   - Source page/location from `sourceLocation`
   - Draft/current-value diff for proposed claims (including the deterministic grade / hole-ID / units fixture)
   - Explicit source-verification acknowledgement control
2. Approval remains a **status-only** server action. Content edits and `status=published` must not be combined in one request.
3. Machine-assisted `Review → Published` requires the acknowledgement; the server stamps `reviewerSourceCheckBy` / `reviewerSourceCheckAt` and existing `reviewedBy` / `reviewedAt` / `publishedAt`.
4. Reject / request-changes returns the record to Draft (or keeps it non-published). Incorrect proposals must not appear on public Explorer routes or anonymous APIs.
5. Roles: Company Admin and Platform Admin may perform the acknowledgement using existing membership/role checks. No new reviewer role in Sprint 5.
6. Limits: no automated grade validation, reserve estimation or investment recommendation. Model confidence is never treated as approval evidence.

## Consequences

- Provenance fields from ADR-0012 must exist before this UI can be complete.
- Publishing tests cover missing acknowledgement rejection and successful status-only approval.
