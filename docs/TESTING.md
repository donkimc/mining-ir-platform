# Testing

## Automated Checks

The repository must provide documented commands for linting, type checking and tests. Run them before review and record the results in the Sprint 1 Notion page.

## Minimum Test Matrix

| Scenario | Expected result |
| --- | --- |
| Public visitor opens Home | Published Aurora Gold data only |
| Public visitor opens Projects | Published projects for the resolved tenant only |
| Public visitor opens draft project | Not found or excluded |
| Unauthenticated user opens dashboard | Redirect to login or equivalent |
| Company Admin reads own tenant | Allowed |
| Company Admin reads another tenant | Rejected without data leak |
| Company Admin writes another tenant | Rejected |
| Company Admin writes another tenant's project | Rejected without data leak |
| Platform Admin lists tenants | Allowed |
| Draft to Published without review | Rejected for disclosure-sensitive content |
| Approved content becomes Published | Allowed and visible publicly |
| Invalid profile/project form | Validation errors; no partial mutation |
| Invalid profile/project form fields | Validation errors; no partial mutation |
| Published disclosure field edit | Rejected; public read unchanged |

## Manual Smoke Test

1. Start the app with seeded Aurora Gold data.
2. Open Home, Projects and a Project Detail page on desktop and mobile widths.
3. Log in as Company Admin and edit a profile field.
4. Confirm the edit remains private until the defined publish action.
5. Publish approved content and confirm the public page changes.
6. Attempt a wrong-tenant URL or mutation.
7. Check loading, empty, error, unauthorized and not-found states.

## Review Handoff

The Sprint 1 implementation handoff for Claude (or human) review lives in:

**[SPRINT1_HANDOFF.md](./SPRINT1_HANDOFF.md)**

It records what shipped, local login credentials, commands run and results, ADR/decision pointers, known limitations, and review focus. Claude should review tenant isolation, publication rules, disclosure approval, docs and responsive behavior. Findings are ordered by severity with file and line references.
