#!/usr/bin/env node
/**
 * Fail if retired Sprint 1–5 fixture terms appear outside the historical allowlist (ADR-0021).
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = process.cwd()

/** Only these tracked historical evidence files may contain retired terms. */
export const HISTORICAL_ALLOWLIST = new Set([
  'docs/SPRINT1_HANDOFF.md',
  'docs/SPRINT1_REVIEW.md',
  'docs/SPRINT2_HANDOFF.md',
  'docs/SPRINT2_REVIEW.md',
  'docs/SPRINT2_REREVIEW.md',
  'docs/SPRINT2_CARRYFORWARD.md',
  'docs/SPRINT3_HANDOFF.md',
  'docs/SPRINT3_REVIEW.md',
  'docs/SPRINT4_HANDOFF.md',
  'docs/SPRINT4_REVIEW.md',
  'docs/SPRINT5_HANDOFF.md',
  'docs/SPRINT5_REVIEW.md',
  // Clearance ADR intentionally records the retired → new mapping.
  'docs/decisions/ADR-0021-fixture-identity-clearance.md',
])

/** Guard source lists the patterns; exclude it from the scan (S6-7). */
export const SELF_EXCLUDE = new Set([
  'scripts/check-retired-fixtures.ts',
])

export const PATTERNS = [
  /\baurora\b/i,
  /aurora-gold/i,
  /auroragold/i,
  /northern\s*copper/i,
  /northern-copper/i,
  /\bAGX\b/,
  /\bNCU\b/,
  /NORTHERN SECRET/i,
  /NORTHERN CATALYST SECRET/i,
  /copper-ridge-isolation/i,
]

export function listTrackedFiles(cwd = root): string[] {
  const out = execSync('git ls-files', { encoding: 'utf8', cwd })
  return out.split('\n').filter(Boolean)
}

export function isBinaryPath(file: string): boolean {
  return /\.(png|jpg|jpeg|gif|webp|ico|pdf|woff2?|zip|gz)$/i.test(file)
}

export function isExcludedFromScan(file: string): boolean {
  return HISTORICAL_ALLOWLIST.has(file) || SELF_EXCLUDE.has(file) || isBinaryPath(file)
}

export function scanRetiredFixtures(args?: {
  cwd?: string
  files?: string[]
  readFile?: (abs: string) => string
}): string[] {
  const cwd = args?.cwd ?? root
  const files = args?.files ?? listTrackedFiles(cwd)
  const readFile =
    args?.readFile ??
    ((abs: string) => {
      return fs.readFileSync(abs, 'utf8')
    })

  const hits: string[] = []
  for (const file of files) {
    if (isExcludedFromScan(file)) continue
    const abs = path.join(cwd, file)
    let text: string
    try {
      text = readFile(abs)
    } catch {
      continue
    }
    for (const pattern of PATTERNS) {
      if (pattern.test(text)) {
        hits.push(`${file} matches ${pattern}`)
        break
      }
    }
  }
  return hits
}

function isMainModule(): boolean {
  try {
    const thisFile = path.resolve(fileURLToPath(import.meta.url))
    const invoked = process.argv[1] ? path.resolve(process.argv[1]) : ''
    return thisFile === invoked
  } catch {
    return true
  }
}

if (isMainModule()) {
  const hits = scanRetiredFixtures()
  if (hits.length > 0) {
    console.error('Retired fixture terms found outside historical allowlist:')
    for (const hit of hits) console.error(`  - ${hit}`)
    process.exit(1)
  }

  console.log('check:retired-fixtures PASS')
  console.log(`Allowlist (${HISTORICAL_ALLOWLIST.size} files):`)
  for (const file of [...HISTORICAL_ALLOWLIST].sort()) console.log(`  - ${file}`)
  console.log(`Self-exclude: ${[...SELF_EXCLUDE].join(', ')}`)
}
