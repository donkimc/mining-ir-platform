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

---
---

# Addendum — Re-review of the S4-1 / S4-2 remediation

**Reviewer:** Claude (Opus 5), independent defect-first re-review
**Reviewed:** 2026-08-17
**Commits:** fix `6b62a89`, live re-verify notes `bccfa30` (HEAD, clean tree apart from one untracked script)
**Target:** `https://mining-ir-platform.vercel.app` (Vercel Production alias → Supabase staging `jthotkkremiesvocfsmr`)
**Scope:** remediation of S4-1 / S4-2 plus residual Sprint 4 Done gates. Not a re-run of the full Sprint 4 review.

## 1. Verdict: **Ship with conditions** (conditions changed)

**The High is cleared.** S4-1's two security- and UX-critical halves are closed on the live alias: the
CSP no longer blocks the OSM frame, and a failed map can no longer present as a silent blank box.
S4-2 is fully closed. No regressions against any Sprint 1–3 gate.

**One new Medium replaces it:** the map is **intermittently removed ~5 seconds after page load even
when it has loaded successfully**, because the load-timeout race can miss the iframe's `load` event.
Users then see the correct accessible text plus "Map unavailable" — never a blank box — so this is a
functional/UX defect with no security or disclosure impact.

**Sprint 4 still should not be marked Done**, and customer content / real Production go-live remain
not recommended, because **L-3 (Supabase PITR/restore rehearsal) is still unevidenced** — the handoff
itself states so at `docs/SPRINT4_HANDOFF.md:5`.

## 2. Are S4-1 and S4-2 closed on the live alias?

**S4-2 — yes, fully closed.**

```
GET https://mining-ir-platform.vercel.app/api/media?limit=5   (anonymous)
keys: alt, createdAt, filename, filesize, focalX, focalY, height, id, mimeType,
      originalFilename, thumbnailURL, updatedAt, url, width
tenant key present: False        expanded company object: False
```

**S4-1 — closed in substance, with a residual defect (S4-6).**

| S4-1 component | Status | Evidence |
| --- | --- | --- |
| CSP permits the OSM frame | ✅ Closed | Response header now carries `frame-src https://www.openstreetmap.org`, scoped to that origin — no wildcard, no `unsafe-*`. Verified on `/projects/north-ridge`. |
| No CSP violations in the browser | ✅ Closed | Browser console clean on load. The Sprint 4 error (`Framing 'https://www.openstreetmap.org/' violates … "default-src 'self'"`) no longer occurs. |
| Map actually renders tiles + marker | ⚠️ Intermittent | Confirmed rendering with tiles and the green marker at 53.12, −121.58 in a real browser. Also confirmed **absent** on other loads — see S4-6. |
| Never a silent blank rectangle | ✅ Closed | On failure the panel renders "Map unavailable. Use the location details above." alongside jurisdiction, location summary and coordinates. |

**Two corrections to my own method, recorded for honesty.** (a) My first screenshots showed a blank
grey box; a control experiment — injecting a same-origin iframe to force a repaint — showed the OSM
frame does composite, so the initial blank was a screenshot-pipeline artifact, not a defect. (b) One
observation of "iframe removed" was taken against the wrong browser tab. Both were re-tested before
anything was written down.

## 3. Findings

| ID | Severity | Area | Evidence | Reproduction | Expected | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- |
| **S4-6** | 🟡 Medium | other (map reliability) | On `/projects/north-ridge`, the OSM iframe is present at load and then removed, with the panel switching to "Map unavailable". Observed removed on 2 of 4 fresh loads; survived >19s on another (`domContentLoadedEventEnd` 1636ms, `loadEventEnd` 1893ms). An identical iframe injected client-side on the same page under the same CSP fires `load` at **500ms** and navigates cross-origin successfully, so OSM itself is reachable and frameable (no `X-Frame-Options`, HTTP 200, ~30–760ms). | Load `/projects/north-ridge` repeatedly; after ~5s check `document.querySelectorAll('iframe').length` and whether the panel reads "Map unavailable". | A map that loads successfully stays visible. | `src/components/public/ProjectLocationMap.tsx`: the `useEffect` arms `MAP_LOAD_TIMEOUT_MS` (5000) at **hydration**, but the server-rendered iframe begins loading during HTML parse and can fire `load` **before** React attaches `onLoad`. The handler never runs, the timer is never cleared, and the timeout removes a working map. Fix by checking readiness at mount rather than relying solely on a future event — e.g. inspect the ref for an already-completed load before arming the timer, arm the timer only after confirming the frame has not yet loaded, or render the iframe client-side only so React owns it from creation. Raising the timeout hides the race without fixing it. |
| **S4-7** | 🟢 Low | staging / hygiene | `scripts/unlock-staging-users.ts` (125 lines) is untracked **and not gitignored** — `git check-ignore` returns nothing, so `git add .` would commit it. The script itself is clean: no hardcoded secrets, loads `.env.staging.local` (gitignored), generates random passwords, prints them once to stdout. | `git status --porcelain` → `?? scripts/unlock-staging-users.ts` | Ops tooling that rotates admin credentials is either reviewed and committed, or explicitly ignored. | Commit it with a short header explaining when to use it, or add it to `.gitignore`. Leaving it in limbo is how it gets committed accidentally. |

### Explicitly re-checked and clean
No Mapbox, Google Maps, API key or access-token pattern in project-detail HTML (0 matches). CSP
`default-src 'self'` unchanged; `frame-src` is the only addition. The new
`tests/content-security-policy.spec.ts` asserts the OSM origin is present **and** that `frame-src`
contains no wildcard and no `unsafe-*` — a good regression guard.

## 4. Status of prior findings and carry-ins

| ID | Prior status | Now | Evidence |
| --- | --- | --- | --- |
| **S4-1** | 🟠 High — map never rendered | ✅ **Closed** (residual S4-6, Medium) | CSP fixed and verified; blank box eliminated; tiles confirmed rendering |
| **S4-2** | 🟡 Medium — `/api/media` expanded `tenant` | ✅ **Closed — verified live** | No `tenant` key, no expanded company object |
| **S4-3** (N4 cap) | 🟢 Low | Still open — deferred to Sprint 5 as agreed | `limit: 1000` materialisation unchanged |
| **S4-4** (ADR-0010 CSP/privacy) | 🟢 Low | Still open | ADR-0010 still has no CSP or visitor-IP analysis, though the CSP requirement is now captured in code and tests |
| **S4-5** (docs publish a stale local password) | 🟢 Low | Still open | `README.md:111-112`, `docs/SPRINT1_HANDOFF.md:34-35` |
| **M-1** | Fixed | ✅ **Confirmed** | `/api/companies` → 1 doc, `aurora-gold`, zero banned keys |
| **L-1** | Fixed with one gap | ✅ **Now fully fixed** | All ten anonymous collections — including `media` — carry no `tenant`, `reviewedBy`, `reviewedAt` or `publishedAt` |
| **L-2** | Fixed | ✅ **Confirmed** | 0 occurrences of Northern poison values across seven endpoints; four draft/cross-tenant slugs all 404 |
| **L-3** | Not verified | ⛔ **Still Not verified** | `docs/SPRINT4_HANDOFF.md:5` states live PITR UI evidence is still required. Docs are not restore evidence. |
| **N3** | Fixed | ✅ **Confirmed** (Sprint 4 review) | Relation-error mapping returns the tenant validation message |
| **N4** | Partially fixed | ⚠️ **Partially fixed** | Tenant scoping correct; 1000-row cap remains (S4-3) |

## 5. Regression sweep — no regressions

Anonymous, live alias: `/api/companies` minimized to Aurora with zero banned keys; all nine content
collections `published` only with no `tenant`/reviewer metadata; zero Northern poison values;
`/projects/hidden-lake`, `/projects/copper-ridge-isolation`,
`/news/draft-financing-placeholder`, `/news/northern-isolation-release` all **404**; discovery filters
(`q=Ridge`, `q=NORTHERN SECRET`, `q=Drill`, `q=Presentation`, injection-shaped `' OR 1=1--`) all 200
with correct published-only or empty results.

**Local `npm run verify` on HEAD: pass — lint, typecheck, 79/79 tests across 11 files, migration-drift,
`build:ci`.** Up from 76 in the first review; the three additions are the two CSP tests and one media
serializer test, both of which target the findings they were written for.

## 6. Out-of-scope check — clean

No new collection since Sprint 3 (`src/collections/` unchanged at 12). No market data, stock quotes,
investor accounts, CRM, analytics, subscriptions, investor PII, AI extraction, SEDAR+, billing, custom
domains, new templates or advanced GIS. `/investors` remains the Sprint 1 placeholder route.

## 7. Remaining blockers

### Before marking Sprint 4 Done
1. **L-3** — perform the Supabase PITR/restore rehearsal on a non-production project and record ref,
   timestamp, method and smoke results. Open across three sprints now.
2. **S4-6** — fix the hydration race so a map that loads stays visible.

### Before customer content / real Production go-live
3. Repair the Vercel **Preview** environment `DATABASE_URI` — Preview builds still fail auth, leaving
   no pre-production environment distinct from the staging-backed alias.
4. Observe and record `DATABASE_SSL_CA` and `PAYLOAD_DATABASE_PUSH` **from the deployed environment**
   rather than assuming Sprint 3 configuration. Still marked "assumed" in the handoff.
5. Execute the promotion plan against `bwftfsfbiyzgwztwtqmh` — `npm run migrate`, never push;
   per-project CA; fictional smoke data first.

### Sprint 5 backlog
S4-3, S4-4, S4-5, S4-7.

**No Critical or High finding is open.** Real Production promotion and customer-content loading remain
**not recommended** until L-3 is evidenced, per ADR-0008's Evidence Standard and this project's
Done-gate treatment of restore rehearsal.

## 8. Closing note

The remediation is correct where it was diagnosed: the CSP fix is precisely scoped and now
regression-tested, and the media serializer gap is properly closed rather than patched around.

S4-6 is worth noting as a category, not just a bug. The Sprint 4 review observed that each sprint's
headline defect came from verifying one layer below where the failure occurs. This fix verified the
right layer — a real browser — but on a **single** load. The failure is timing-dependent, so one
successful observation could not distinguish "works" from "works about half the time". For anything
race-shaped, the check has to be repeated before it counts as evidence.
