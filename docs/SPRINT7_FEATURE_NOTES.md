# Sprint 7+ feature notes — role-separated disclosure approval

**Status:** Planning input only (not a Sprint 7 plan, ADR, or implementation checklist).  
**Audience:** Product / planning agents picking up the next sprint after Sprint 6 go-live.  
**Origin:** Operator clarification during Sprint 6 Production cutover (2026-08) — current dashboard conflates author and approver.

These notes describe **how the feature is intended to work** once built. They do not prescribe tasks, estimates, file lists, or migration steps.

---

## Problem today

Publishable content already uses **Draft → Review → Published → Archived**.

- **Published** means approved for the public site.  
- **Reject / request changes** means moving **Review → Draft** (there is no separate Rejected status).  
- **Archive** means retire content, not reject a submission.

Authorization does **not** match that story yet. Every dashboard user is effectively **Company Admin**: the same person can draft, submit for review, and approve to Published. Membership roles **Editor** and **Viewer** exist on `tenant-memberships` but are not enforced on dashboard status actions.

Human approval is therefore a **process checkpoint + audit fields** (`reviewedBy`, `reviewedAt`, `publishedAt`), not a **second privileged role**.

---

## Feature: separate who may submit from who may publish

### Intent

For disclosure-sensitive IR content, **submitting for review** and **approving to Published** are different authorities. A Company Admin (or dedicated approver) can publish; an Editor cannot. Public investors still only see **Published**.

### Roles (behavioral contract)

| Role | Tenant scope | Content | Status transitions |
| --- | --- | --- | --- |
| **Viewer** | Own tenant only | Read dashboard content | None |
| **Editor** | Own tenant only | Create/edit while Draft (and while allowed in Review for fixes after return) | Draft → Review (submit); Review → Draft (request changes / “reject”); may Archive only if product later allows Editors to archive drafts — default: **no Publish** |
| **Company Admin** | Own tenant only | Full content edit where publication rules allow | All Editor transitions **plus** Review → Published (approve); Published → Review when starting a new disclosure cycle; Archive as today |
| **Platform Admin** | Cross-tenant platform | Tenants, users, memberships (existing Platform Admin surfaces) | Does **not** replace day-to-day IR approval; may still use CMS for break-glass, but the product story is Company Admin / Editor on the dashboard |

Membership remains the source of truth: active `tenant-memberships` row with the role above. UI hiding is not authorization; status mutations must fail closed server-side for Editors attempting Published.

### How approve and reject work (unchanged statuses)

- **Approve:** status-only transition **Review → Published**. Records reviewer identity and timestamps. Must not change disclosure fields in the same request (existing rule).  
- **Reject / request changes:** status-only transition **Review → Draft**. Author revises, then submits to Review again.  
- **Still forbidden:** Draft → Published in one step; silent in-place rewrite of Published disclosure fields.

### UX shape (product behavior, not UI spec)

Prefer explicit actions over a single ambiguous dropdown:

- Editor: **Submit for review**, **Request changes** (back to Draft).  
- Company Admin / approver: **Approve & publish**, **Request changes**.  

Same underlying statuses. Optional later: a **Review queue** listing items waiting for approval with source context.

### Optional hardening (same feature family)

**Four-eyes:** refuse Publish when the approver is the same user who last submitted to Review (or last edited disclosure fields). Useful for compliance-minded issuers; can be a tenant setting or platform default. Not required for the first cut of role separation.

### Machine-assisted content

Existing provenance / source-check acknowledgement for machine-assisted drafts remains. Role separation does not replace that gate: an Editor still cannot publish, and an Approver still must satisfy source-check rules where they apply (ADR-0004 / ADR-0012 family).

### What this feature is not

- Not a new publication status named “Rejected.”  
- Not automatic publication.  
- Not investor accounts, market data, or external AI egress.  
- Not custom client domains or billing.  
- Not rewriting historical Sprint 1–6 review evidence.

### Success intuition for a planner

A seeded **Editor** for a tenant can put a news/document into **Review** and pull it back to **Draft**, but cannot set **Published**. A **Company Admin** on the same tenant can approve **Review → Published** and the public site shows the content only after that. Cross-tenant isolation and Published-only public reads remain unchanged.

---

## Pointers for planning

- Current status UI copy already hints that Draft-from-Review means request changes: `PublicationStatusForm` in the dashboard.  
- Role enum already includes `editor` and `viewer` (`MEMBERSHIP_ROLES`); dashboard gates today use `company_admin` only (`requireCompanyAdmin`).  
- Governing disclosure ADR: `docs/decisions/ADR-0004-human-approval-for-technical-disclosure.md`.  
- Place a formal ADR and Sprint N plan only when the next sprint is opened; this file is the backlog note to catch that work.
