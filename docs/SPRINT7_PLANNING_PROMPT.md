# Sprint 7 Planning Prompt — role-separated disclosure approval

**Status:** Planning input. No implementation is authorized by this document.
**Written:** 2026-08-25, after `docs/SPRINT6_REREVIEW2.md` closed Sprint 6 at 0 Critical / 0 High.
**Audience:** the planning agent (Codex). Its output belongs in `docs/SPRINT7_PLAN.md`.

## How to use this file

Paste the prompt in [§3](#3-the-prompt) to Codex. Everything above it is context for a human
deciding *whether* to start Sprint 7; everything inside it is what Codex needs.

The ground truth in §2 was verified against the repository at commit `5dfa1a1` on 2026-08-25. It is
recorded here so the planner does not re-derive it — and, more importantly, does not plan work that
is already done. If any of it has drifted by the time Sprint 7 opens, re-verify before planning.

---

## 1. Why Sprint 7 comes before customer content

Customer-content promotion is currently blocked pending Product Director sign-off. The
recommendation is to keep it blocked until Sprint 7 lands, rather than promoting first.

Role separation is a **prerequisite** for real issuers, not a later refinement. With actual customer
content, one person being able to draft *and* publish their own technical disclosure is the
compliance gap — the thing ADR-0004 exists to prevent. Promoting first means onboarding real issuers
onto the authorization model you are about to replace.

This mirrors the Sprint 4 → 5 sequencing call: make the gate real before the gate has real
consequences.

**Independent of Sprint 7**, the ADR-0020 operator gates remain open: Production backup/restore
rehearsal, deployed observation of `DATABASE_SSL_CA` / `PAYLOAD_DATABASE_PUSH`, and a rollback
exercise. Sprint 7 ships no migration, so these do not block it — but they still block customer
content.

---

## 2. Verified ground truth (2026-08-25, commit `5dfa1a1`)

### Sprint 7 needs no migration

```ts
// src/lib/constants.ts:5
export const MEMBERSHIP_ROLES = ['platform_admin', 'company_admin', 'editor', 'viewer'] as const
```

`editor` and `viewer` already exist in the enum and are already rendered as options on the
`tenant-memberships` `role` field (`src/collections/TenantMemberships.ts:42-52`). Sprint 7 is a
**pure authorization sprint**: no schema change, no new collection, no migration, no drift risk.

That makes it materially lower-risk than Sprints 5 and 6 on the database axis — and the planner
should not spend the sprint's budget on migration safety it does not need.

### The likely defect shape: seven parallel call sites

`requireCompanyAdmin()` (`src/lib/auth.ts:97`) is the only dashboard authority gate today. It is
called from **seven** parallel server-action files:

```
src/app/(frontend)/dashboard/projects/actions.ts
src/app/(frontend)/dashboard/share-structure/actions.ts
src/app/(frontend)/dashboard/management/actions.ts
src/app/(frontend)/dashboard/exploration/actions.ts
src/app/(frontend)/dashboard/news/actions.ts
src/app/(frontend)/dashboard/documents/actions.ts
src/app/(frontend)/dashboard/page.tsx
```

plus roughly 28 call sites across the matching `page.tsx` / `new/page.tsx` / `[id]/page.tsx` files.

Every one must change identically. **If one is missed, an Editor can publish that one content type.**
This is the exact "paths that should behave identically" shape (`AGENTS.md` Evidence Rule 8) that
produced the headline defect in Sprints 4, 5 and 6. Plan verification that enumerates all content
types in a single test rather than testing each type separately — a per-type test suite is precisely
what lets one missed file slip through.

### Risk profile

Lowest database risk of any sprint so far; **highest disclosure risk**. A bug here is not a broken
page — it is unreviewed technical disclosure reaching investors.

---

## 3. The prompt

```text
Plan Sprint 7 for Mining IR Platform: role-separated disclosure approval.

Read first, in order:
- docs/SPRINT7_FEATURE_NOTES.md — the behavioral contract. This is planning input, not a plan.
- docs/decisions/ADR-0004-human-approval-for-technical-disclosure.md — the governing constraint.
- docs/SPRINT6_REREVIEW2.md — the independent review closing Sprint 6 (0 Critical, 0 High).
- AGENTS.md — Evidence Rules 1–9, especially Rule 8 (paths that should behave identically must be
  verified together) and Rule 9 (verify the artifact you ship, not the workspace you built it in).

GROUND TRUTH — verified 2026-08-25 at commit 5dfa1a1, do not re-derive or contradict without checking:
- MEMBERSHIP_ROLES in src/lib/constants.ts ALREADY contains 'editor' and 'viewer', and the
  tenant-memberships role field already offers them. Sprint 7 needs NO migration and NO new
  collection. Plan it as an authorization sprint. If you conclude otherwise, say why explicitly.
- requireCompanyAdmin() (src/lib/auth.ts:97) is the only dashboard authority gate today. It is
  called from SEVEN parallel actions.ts files: dashboard/{projects,share-structure,management,
  exploration,news,documents}/actions.ts plus dashboard/page.tsx. Every one must change identically.
  Treat "one of the seven was missed" as the most likely defect in this sprint and plan verification
  that would catch it — a single test that enumerates all content types, not per-type tests.

SCOPE
Task 0 (carry-in, small): N-2 broaden the retired-fixture exemption pattern (docs/SPRINT<n>_<WORD>.md
  variants like _REREVIEW2 are currently NOT exempt); N-3 make (frontend)/not-found.tsx tolerate an
  unknown templateKey instead of throwing (resolveTemplateKey throws → 500 on a 404 path); N-4
  de-duplicate the S6-5/S6-6 rows in docs/SPRINT6_HANDOFF.md and annotate the superseded
  "verify exit 0 / 125 tests" claim for 93bf908.

Main scope: enforce the role contract in SPRINT7_FEATURE_NOTES.md.
- Editor: may create/edit Drafts, submit Draft → Review, and return Review → Draft. May NOT publish.
- Company Admin: all Editor transitions plus Review → Published and Published → Review.
- Viewer: read-only.
- Enforcement must be server-side and fail closed. Hiding a button is not authorization — plan an
  explicit test that an Editor's direct server-action call to publish is REJECTED, for every content
  type, not a UI test.
- Preserve unchanged: status-only approval (no disclosure-field edits in the same request),
  server-derived reviewedBy/reviewedAt/publishedAt, provenance and source-check rules for
  machine-assisted content, tenant isolation, Published-only public reads.
- Seed at least one Editor membership per tenant so the negative path is exercised by fixtures.

Four-eyes (approver ≠ last submitter) is OPTIONAL hardening. Recommend in or out with reasoning;
do not assume it is required for the first cut.

OUT OF SCOPE
Customer-content promotion (Product Director decision, gated on this sprint landing); a "Rejected"
status; investor accounts or PII; market data; external LLM egress; custom domains; billing;
rewriting Sprint 1–6 review evidence; the ADR-0020 operator gates (restore rehearsal, deployed env
observation, rollback exercise) — note them as prerequisites, do not plan them as sprint tasks.

DELIVERABLES
1. Sprint 7 plan with exit criteria stated as observable behaviour, not tasks completed.
2. A new ADR for the authorization model (next free number after ADR-0021), explaining how it
   strengthens ADR-0004 and why membership role is the source of truth over user-level role.
3. An explicit verification plan: what must be true on a live tenant host, what must be true
   server-side, and how "one of seven actions.ts missed" would be caught.
4. A risk section naming what could let an Editor publish anyway.

Do not write implementation code. Do not weaken any existing disclosure, isolation or provenance
control to make role separation simpler.
```

---

## 4. Carry-in detail for Task 0

Small items from `docs/SPRINT6_REREVIEW2.md`, none worth their own sprint:

| ID | What | Where |
| --- | --- | --- |
| **N-2** | Exemption rule misses suffixed evidence filenames — `docs/SPRINT6_REREVIEW2.md` and `docs/SPRINT6_REVIEW_FINAL.md` are not exempt | `scripts/check-retired-fixtures.ts` |
| **N-3** | `resolveTemplateKey()` throws on an unknown key inside the not-found boundary → 500 on a path whose job is 404 | `src/app/(frontend)/not-found.tsx` |
| **N-4** | Handoff table duplicates the S6-5 / S6-6 rows; the superseded `93bf908` "verify exit 0" claim is unannotated | `docs/SPRINT6_HANDOFF.md` |

**Operator task, not Cursor's:** one `example.com` link is still live on Production —
`zenthoriq-resource` document `zenthoriq-isolation-doc` has
`externalUrl: https://example.com/zenthoriq-resource-doc`. Clear it in the CMS on
`admin.nrlaunch.com`. Seed no longer sets it, but seed does not mutate Production CMS edits.

---

## 5. What the reviewer will check

Recorded in advance so the plan can be built against it rather than discovering it at review time:

1. An Editor calling the publish server action **directly** — bypassing the UI — is rejected for
   **every** content type. UI hiding proves nothing.
2. A Company Admin can still approve Review → Published on every content type.
3. Status-only approval still holds: no disclosure-field edit in the same request as a publish.
4. `reviewedBy` / `reviewedAt` / `publishedAt` remain server-derived, never client-supplied.
5. Tenant isolation and Published-only public reads unchanged — a role change must not become a
   cross-tenant read path.
6. An Editor in tenant A has no authority in tenant B.
7. `npm run verify` exits 0 on the **committed** tree with `build:ci` executing (Evidence Rule 9).
