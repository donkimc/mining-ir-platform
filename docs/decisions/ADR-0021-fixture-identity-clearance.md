# ADR-0021: Fictional Fixture Identity Clearance And Historical Allowlist

## Status

Accepted — Product Director 2026-08-20.

## Context

Active demo identities used real-sounding Aurora Gold / Northern Copper names. Sprint 6 renames them to coined identities and must not falsify historical review evidence.

## Decision

1. Active fixtures:
   - Qelvarion Resource Corp. (`qelvarion-resource`, `QVRN`)
   - Zenthoriq Resource Ltd. (`zenthoriq-resource`, `ZQRI`)
   - Veylithra Tungsten Corp. (`veylithra-tungsten`, `VYTH`)
2. Before active seed/docs adoption, record registry/ticker clearance evidence (SEDAR+/EDGAR/relevant registry search terms, date, result, decision).
3. Historical Sprint 1–5 reviews/handoffs retain quoted retired terms as evidence, with a mapping note at the top of each allowlisted file.
4. `npm run check:retired-fixtures` fails if retired terms appear outside the bounded allowlist, or if the allowlist expands without a documented decision.

## Clearance evidence (2026-08-21)

| Term | Sources checked | Result | Decision |
| --- | --- | --- | --- |
| Qelvarion Resource Corp. / `qelvarion-resource` / `QVRN` | Web/SEDAR+/EDGAR-oriented search | No matching issuer or ticker `QVRN` found; near-misses (Q-Gold/QGR, QELT) are distinct | Adopt |
| Zenthoriq Resource Ltd. / `zenthoriq-resource` / `ZQRI` | Web/SEDAR+/EDGAR-oriented search | No matching issuer or ticker `ZQRI`; EDGAR hit for *Zenithra* Group Inc. is a distinct coined name | Adopt |
| Veylithra Tungsten Corp. / `veylithra-tungsten` / `VYTH` | Web/SEDAR+/EDGAR-oriented search | No matching issuer or ticker `VYTH` found | Adopt |
| Project names (coined: Northridge Belt, Greywater Flats, Hollowspire Ridge, Fennwick Drift) | Same pass | No SEDAR+/EDGAR issuer collision found for these coinages | Adopt |

## Consequences

- Living docs, seed, tests, config and rendered public output must contain zero retired Aurora/Northern terms.
- Allowlist is explicit and reviewed.
