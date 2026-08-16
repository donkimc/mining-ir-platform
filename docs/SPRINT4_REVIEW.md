# Sprint 4 Review — Investor Features (Discovery + Maps)

**Reviewer:** Claude (Opus 5), independent defect-first review
**Reviewed:** 2026-08-16
**Release candidate:** implementation `f068fc3`, handoff/evidence `4d4d50f` (HEAD, clean tree)
**Verification target:** `https://mining-ir-platform.vercel.app` (Vercel Production alias → Supabase staging `jthotkkremiesvocfsmr`), deployment `dpl_3o4HCk6uT3oF9W9wtkyAurGV4zn1`
**Evidence standard:** ADR-0008 — claims verified by reproducible command, deployment observation, infrastructure setting or test fixture

---

## 1. Verdict: **Ship with conditions**

No Critical findings. No security or tenant-isolation regressions — every Sprint 1–3 gate holds under
direct probing. The carry-in fixes (M-1, L-1, L-2, N3) are genuinely implemented and verified live.

**One High blocks marking Sprint 4 Done:** the project map — the sprint's headline feature — **never
renders in any browser**, because the application's own Content-Security-Policy blocks the
OpenStreetMap iframe. This was verified with the browser's own CSP violation error. The handoff records
the map as live-verified evidence; that evidence was gathered by grepping server-rendered HTML, which
proves the markup exists but not that the browser loads it.

**Do not promote customer content or perform real Production go-live** until S4-1 is fixed and L-3
restore evidence is recorded. Both are already acknowledged as pending by the handoff in L-3's case.

---

## 2. Verified vs claimed-but-unverified

### Verified live (staging alias, anonymous)
`/api/companies` minimization; anonymous serializer scope across nine collections; Northern Copper
poison-value absence across seven collections; published-only discovery on `/projects`, `/news`,
`/documents` including filter, empty-state and injection-shaped inputs; draft and cross-tenant slug
404s; map markup, attribution, key-absence and CSP behaviour; related-content links; security headers.

### Verified live (local server, release-candidate build)
Full disclosure-gate battery; forged review-metadata stripping; cross-tenant relation rejection; N3
relation-error mapping; `npm run verify` — lint, typecheck, **76/76 tests**, migration-drift,
`build:ci`.

### Claimed but **not verified** (marked Not verified, not Pass)

| Claim | Why not verified |
| --- | --- |
| **L-3 Supabase PITR/restore rehearsal** | Handoff states live UI rehearsal not performed. Docs-only. Not accepted as evidence. |
| **`DATABASE_SSL_CA` on deployed env** | Handoff states "not re-dumped; Sprint 3 config assumed". No reviewer access to Vercel settings. Indirect signal only: the deployment boots and serves DB-backed routes, which is consistent with a working TLS config but does not prove CA pinning. |
| **`PAYLOAD_DATABASE_PUSH` on deployed env** | Same. Local `build:ci` forces `false`; deployed value not observed. |
| **Authenticated staging flows** (dashboard, CMS, Platform Admin separation on staging) | Staging credentials were rotated during Sprint 3 remediation and new values were correctly **not** provided to this review. Equivalent checks were run locally instead. This is correct hygiene, not a defect. |
| **Vercel Preview environment** | Handoff records a failed CLI Preview deploy (`password authentication failed for user "postgres"`). Not used as evidence, per instruction. Preview env `DATABASE_URI` remains broken. |

---

## 3. Findings

| ID | Severity | Area | Evidence | Reproduction | Expected | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- |
| **S4-1** | 🟠 **High** | other (feature / evidence integrity) | Browser console on `/projects/north-ridge`: `Framing 'https://www.openstreetmap.org/' violates the following Content Security Policy directive: "default-src 'self'". The request has been blocked. Note that 'frame-src' was not explicitly set, so 'default-src' is used as a fallback.` Response header CSP has no `frame-src`. Iframe element present at 382×192 with `contentDocument` inaccessible and no rendered content. | Load `https://mining-ir-platform.vercel.app/projects/north-ridge` in any CSP-enforcing browser; observe the console error and the empty map area. `curl -sI …/projects/north-ridge \| grep -i content-security-policy` shows `default-src 'self'` and no `frame-src`. | The OSM embed renders, or the component falls back to its text-only state with the "Map unavailable" message. | Add `frame-src https://www.openstreetmap.org` (and `https://*.openstreetmap.org` if tiles redirect) to the CSP in `next.config.ts:26-`. **Also** fix the fallback: `ProjectLocationMap.tsx:99` relies on `onError`, which does **not** fire for CSP-blocked frames, so `mapFailed` never becomes true and the visitor sees an unexplained blank box rather than the graceful message at `:122-126`. Use an `onLoad` + timeout probe, or render the map only when a runtime capability check passes. |
| **S4-2** | 🟡 Medium | public-leak / L-1 consistency | Anonymous `GET /api/media?limit=5` returns `tenant` expanded to the **full company object**: `legalName`, `irContactName`, `irContactEmail`, `irContactPhone`, `officeAddress`, `investmentThesis`, `socialLinks`. All other nine collections return no `tenant` key. `src/collections/Media.ts:144-` defines its own `afterRead` that never calls `serializeAnonymousPublicDoc`. | `curl -s "https://mining-ir-platform.vercel.app/api/media?limit=5" \| python3 -c "import sys,json;print(sorted(json.load(sys.stdin)['docs'][0].keys()))"` → includes `tenant`. | Per L-1's stated contract, anonymous responses strip `tenant`. | Compose the serializer into Media's `afterRead` (call `serializeAnonymousPublicDoc` for `!req.user` alongside the existing URL rewriting), and set `depth: 0` on the anonymous media read so the relation is never expanded. **Not a cross-tenant leak** — the data is Aurora's own and already public on its site — but it contradicts the written contract and needlessly expands a relation on an anonymous endpoint. |
| **S4-3** | 🟢 Low | media | `src/collections/Media.ts` `publishedReferencedMediaWhere` now resolves the request tenant before querying (good), but both `payload.find` calls retain `limit: 1000` and still materialise an id set. | Code inspection; behaviour beyond 1000 records not exercised by any fixture. | N4's original concern was the silent cap, not only the tenant scope. | Replace the materialised `id IN (…)` set with a bounded relation/status subquery, or add a fixture proving behaviour past the cap. Handoff marks N4 "Fixed"; the security half is fixed, the scalability cliff is not. |
| **S4-4** | 🟢 Low | other (ADR completeness) | `docs/decisions/ADR-0010-…` contains **0** mentions of CSP/`frame-src` and **0** mentions of visitor privacy, IP disclosure or third-party requests. | `grep -ciE "content-security\|csp\|frame-src" docs/decisions/ADR-0010-*.md` → 0; same for privacy terms. | An ADR selecting an iframe-embedded third-party provider should record the CSP implication and the visitor-data implication. | Amend ADR-0010 with (a) the CSP `frame-src` requirement — its omission is the direct cause of S4-1 — and (b) an explicit note that every visitor's IP is disclosed to the OpenStreetMap Foundation on page load, which is in tension with the sprint goal's "no visitor PII" framing. State whether that is accepted, and whether the embed should be click-to-load. |
| **S4-5** | 🟢 Low | other (docs) | `README.md:111-112` and `docs/SPRINT1_HANDOFF.md:34-35` publish `ChangeMeLocal1!` as the local seed password. The actual local seed password in `.env.local` differs — a login with the documented value returns **401**. | `curl -X POST localhost:3000/api/users/login -d '{"email":"admin@auroragold.local","password":"ChangeMeLocal1!"}'` → 401. | Documented local credentials work, or the docs point at the env var instead of a literal. | Replace the literal tables with a pointer to `SEED_COMPANY_ADMIN_PASSWORD` / `SEED_PLATFORM_PASSWORD` in `.env.local`. Publishing literal credential tables in docs is the same pattern that produced Sprint 3's H-1. |

### Explicitly checked and **not** found
- No reflected XSS in the discovery search echo. `?q="><script>alert(1)</script>` is escaped to `&quot;&gt;&lt;script&gt;` in the input value; React handles it correctly. The `NORTHERN` string appearing in `?q=NORTHERN SECRET` responses is the reflected form value only, not data — matching the handoff's claim.
- No Mapbox, Google Maps, API key, access token or `pk.*` pattern anywhere in project-detail HTML.
- No unbounded discovery queries: `src/lib/public-data.ts` uses `limit: 100` for lists, consistent with ADR-0011's ≤100 bound.

---

## 4. Carry-in status

| ID | Handoff claim | Reviewer status | Evidence |
| --- | --- | --- | --- |
| **M-1** | Fixed | ✅ **Fixed — verified live** | Anonymous `/api/companies` returns `totalDocs: 1`, slug `aurora-gold` only. Zero occurrences of `websiteDomain`, `subdomain`, `templateKey`, `tenant`, `reviewedBy`, `reviewedAt`, `publishedAt`. Northern Copper absent. |
| **L-1** | Fixed | ⚠️ **Fixed with one gap** | `ANON_STRIP_KEYS` (`src/lib/collection-hooks.ts`) correctly adds `tenant`, `websiteDomain`, `subdomain`, `templateKey`. Verified clean across 8 collections. **`/api/media` is the exception** — see S4-2. |
| **L-2** | Fixed | ✅ **Fixed — verified live** | Zero occurrences of `NORTHERN SECRET`, `NORTHERN CATALYST SECRET`, `northern` or `copper-ridge-isolation` across seven anonymous collection endpoints. `/projects/copper-ridge-isolation` → 404, `/projects/hidden-lake` → 404, `/news/northern-isolation-release` → 404. `?q=NORTHERN SECRET` returns an empty result set. Fixtures confirmed present locally (tenant 2 project, highlight, catalyst). |
| **L-3** | Docs only; live evidence pending | ⛔ **Not verified** | Handoff states the Supabase PITR/restore UI rehearsal was not performed. `docs/OPERATIONS.md` documents the procedure. **Docs are not restore evidence.** Remains open. |
| **N3** | Fixed | ✅ **Fixed — verified live (local)** | `PATCH {"project":999999}` now returns `Related project must belong to the same tenant.` — previously a bare `Not Found`. The `APIError` status-400 narrowing works. |
| **N4** | Fixed | ⚠️ **Partially fixed** | Tenant scoping added and correct. `limit: 1000` materialisation retained — see S4-3. |

---

## 5. Map provider assessment against ADR-0010

| ADR-0010 clause | Status |
| --- | --- |
| Provider-neutral, no paid API key | ✅ OSM embed; **0** Mapbox/Google references; no key or token patterns in output |
| Render OSM embed when coordinates are valid | ⚠️ Markup emitted correctly, but **blocked by CSP at runtime** (S4-1) |
| Always render accessible text fallback | ✅ "Jurisdiction", "Location", "Approximate coordinates: 53.12, -121.58" all present and rendered above the map area |
| No unrestricted third-party keys in client output | ✅ Verified |
| Coordinate validation | ✅ `isValidMapCoordinate` rejects non-numbers, NaN/Infinity and out-of-range lat/lon |
| Invalid/missing coordinates render no marker | ✅ `/projects/cedar-creek` (no coords) emits no iframe and keeps the heading plus a text explanation |
| Unpublished / wrong-tenant coordinates never render | ✅ `/projects/hidden-lake` and `/projects/copper-ridge-isolation` → 404; no coordinates in any anonymous JSON |
| "Illustrative location" labelling | ✅ "Illustrative location for orientation only — not a technical survey product." — appropriate for a securities context |
| OSM attribution visible | ⚠️ Attribution text link renders; in-embed attribution does not, because the embed does not load |
| Accessibility | ✅ `aria-labelledby` section, iframe `title`, `role="status"` on fallback text, manual "Hide map and use text location only" control |
| **CSP implication** | ❌ **Not addressed by the ADR** (S4-4) |
| **Visitor IP disclosure to a third party** | ❌ **Not addressed by the ADR** (S4-4) |

**Assessment:** the provider choice and its guardrails are sound and appropriate for a securities-adjacent
product. The implementation is careful — coordinate validation, labelling and accessibility are better
than the ADR required. The feature nevertheless does not function, and the ADR did not surface the two
considerations that would have caught it.

---

## 6. Discovery / related-content assessment against ADR-0011

| ADR-0011 clause | Status |
| --- | --- |
| Bounded limits (≤100 per list) | ✅ `src/lib/public-data.ts` uses `limit: 100` for lists, `20` for sidebars |
| Stable sort orders | ✅ Existing `displayOrder` / `-releaseDate` / `-publicationDate` orders preserved |
| Supported filters via query params | ✅ `q` on `/projects`, `/news`, `/documents`; `category` on `/documents`; server-side, applied in the data query |
| Published-only results | ✅ Every anonymous endpoint returned `status=['published']` exclusively |
| Draft/Review/Archived absent from list, detail, metadata and JSON | ✅ `?q=Hidden` → empty; `/projects/hidden-lake` → 404; `?q=Financing` → empty; `/news/draft-financing-placeholder` → 404 |
| Cross-tenant records absent | ✅ `?q=Copper` and `?q=NORTHERN SECRET` → empty; no Northern values in any response |
| Empty/invalid filters produce intentional states without leaking existence | ✅ Empty results render an empty state; no "record exists but is hidden" disclosure. Injection-shaped input (`' OR 1=1--`) returns an empty set with no error |
| Related published content cannot cross tenants or reveal non-published records | ✅ `/projects/north-ridge` related links resolve to `/news/north-ridge-drill-program` only — a published, same-tenant record |
| No visitor PII stored | ✅ No new collection, no query persistence, no visitor identifier observed |

**Assessment:** the discovery contract is implemented as specified and is the strongest part of this
sprint. Server-side filtering on the resolved tenant with `Published` applied at the query — rather than
client-side filtering of a broad fetch — is the correct architecture and the one the handoff's risk
section called for.

---

## 7. Regressions against Sprint 1–3 gates

**None found.** All gates re-probed:

| Gate | Result |
| --- | --- |
| Tenant isolation | ✅ Cross-tenant relation assignment rejected; no cross-tenant data in any anonymous endpoint |
| Draft → Review → Published | ✅ `draft→published` rejected |
| Status-only approval | ✅ `{"status":"published","body":"x"}` rejected: "Approval must be a status-only action" |
| Published disclosure immutability | ✅ Genuinely-changed `body`, `title`, `excerpt`, `sourceUrl` on a published record all rejected; DB value unchanged after four attempts |
| Server-derived review metadata | ✅ Forged `reviewedBy`/`reviewedAt` on create stripped (`reviewed_by_id` NULL in DB) |
| Published-only public reads | ✅ All nine collections `published` only |
| Private storage authorization | ✅ (Sprint 3 path unchanged; anonymous media limited to published-referenced records) |
| No schema push on Preview/Production | ✅ `build:ci` forces `PAYLOAD_DATABASE_PUSH=false`; guards unchanged. Deployed env value not observed — see §2 |
| Security headers | ✅ CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS all present |
| Migration drift | ✅ Pass; no new migration, correctly — Sprint 4 introduced no schema change |

**A note on method.** My first probe of published-disclosure immutability appeared to return `OK`,
which would have been a Critical regression. It was a false positive: my payload reused the record's
existing value, so `disclosureFieldsChanged` correctly saw no change. Re-testing with genuinely
different values produced four clean rejections. Recording this because a less careful pass would have
filed a Critical that does not exist.

---

## 8. Out-of-scope check

**No out-of-scope investor features shipped.** Verified absent from code and deployed output: market
data or stock quotes; investor analytics or recommendations; email subscriptions or notifications; any
investor-PII collection; investor accounts or CRM; AI extraction or SEDAR+; billing, custom domains or
new templates; advanced GIS, drill-hole or 3D layers; paid map providers. No new collection and no
migration were introduced, consistent with the plan.

---

## 9. Remaining blockers

### Before marking Sprint 4 Done
1. **S4-1 (High)** — add `frame-src` for OpenStreetMap to the CSP, and make the map's failure path
   actually trigger. Re-verify **in a browser**, not by grepping HTML.
2. **L-3** — perform the Supabase PITR/restore rehearsal on a non-production project and record
   project ref, timestamp, method and smoke results.

### Before loading customer content or real Production go-live
3. **S4-2 (Medium)** — close the `/api/media` serializer gap so L-1 is uniform.
4. Repair the Vercel **Preview** environment `DATABASE_URI` — Preview builds currently fail auth, so
   there is no working pre-production environment separate from the staging-backed alias.
5. Observe and record `DATABASE_SSL_CA` and `PAYLOAD_DATABASE_PUSH` **from the deployed environment**
   rather than assuming Sprint 3 configuration.
6. Complete the ADR-0009/0010/0011 promotion prerequisites in `SPRINT4_HANDOFF.md` §"Production
   Promotion Plan" against `bwftfsfbiyzgwztwtqmh` — `npm run migrate`, never push; per-project CA;
   fictional smoke data first.

### Sprint 5 backlog
S4-3, S4-4, S4-5.

**Per ADR-0008 and the review contract, customer-content promotion and real Production go-live are not
recommended while S4-1 remains open.**

---

## 10. Closing observation

This is the cleanest implementation pass in the project's history: the carry-ins were genuinely fixed
rather than nominally closed, the discovery contract is architecturally correct, the map component is
more careful than its ADR required, and the handoff is candid about what it did not verify — L-3, the
deployed TLS/push values and the failed Preview deploy are all disclosed rather than papered over. That
candour is what made this review fast.

The one High is the same shape as every prior sprint's headline defect: **evidence gathered from the
layer below the one where the failure occurs.** Sprint 1 trusted a green test suite over a build;
Sprint 2 trusted the app route over the storage bucket; Sprint 3 trusted a stale deployment URL; Sprint
4 trusted server-rendered HTML over browser execution. The markup was correct every time. The fix is
not more tests — it is asking, for each new user-facing feature, *what layer actually has to succeed for
a visitor to see this, and did I observe that layer?*
