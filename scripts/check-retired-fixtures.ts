#!/usr/bin/env node
/**
 * Fail if retired Sprint 1–5 fixture terms appear outside historical evidence paths (ADR-0021).
 *
 * Exemption is by *class* (sprint evidence / clearance ADR / this guard), not a hand-maintained
 * per-file list — new SPRINT*_REVIEW.md files must not re-break the gate (S6-7).
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = process.cwd()

/**
 * Paths whose job is to record retired identities (or the clearance mapping).
 * Keep any extra exact paths that these globs do not cover in EXTRA_ALLOWLIST.
 */
export const HISTORICAL_PATH_PATTERNS: RegExp[] = [
  /^docs\/SPRINT\d+_HANDOFF\.md$/,
  /^docs\/SPRINT\d+_REVIEW\.md$/,
  /^docs\/SPRINT\d+_REREVIEW\.md$/,
  /^docs\/SPRINT\d+_CARRYFORWARD\.md$/,
  /^docs\/decisions\/ADR-0021-.*\.md$/,
]

/** Exact paths not covered by HISTORICAL_PATH_PATTERNS (currently none). */
export const EXTRA_ALLOWLIST = new Set<string>([])

/** Guard source lists the patterns; exclude it from the scan. */
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

export function isHistoricalEvidencePath(file: string): boolean {
  if (EXTRA_ALLOWLIST.has(file)) return true
  return HISTORICAL_PATH_PATTERNS.some((pattern) => pattern.test(file))
}

export function isExcludedFromScan(file: string): boolean {
  return (
    isHistoricalEvidencePath(file) || SELF_EXCLUDE.has(file) || isBinaryPath(file)
  )
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
  console.log('Historical path patterns:')
  for (const pattern of HISTORICAL_PATH_PATTERNS) console.log(`  - ${pattern}`)
  if (EXTRA_ALLOWLIST.size > 0) {
    console.log(`Extra allowlist (${EXTRA_ALLOWLIST.size}):`)
    for (const file of [...EXTRA_ALLOWLIST].sort()) console.log(`  - ${file}`)
  }
  console.log(`Self-exclude: ${[...SELF_EXCLUDE].join(', ')}`)
}
