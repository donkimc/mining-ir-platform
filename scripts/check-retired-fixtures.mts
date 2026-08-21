#!/usr/bin/env node
/**
 * Fail if retired Sprint 1–5 fixture terms appear outside the historical allowlist (ADR-0021).
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

/** Only these tracked historical evidence files may contain retired terms. */
const HISTORICAL_ALLOWLIST = new Set([
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

const PATTERNS = [
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

function listTrackedFiles() {
  const out = execSync('git ls-files', { encoding: 'utf8' })
  return out.split('\n').filter(Boolean)
}

function isBinaryPath(file) {
  return /\.(png|jpg|jpeg|gif|webp|ico|pdf|woff2?|zip|gz)$/i.test(file)
}

const hits = []
for (const file of listTrackedFiles()) {
  if (HISTORICAL_ALLOWLIST.has(file)) continue
  if (isBinaryPath(file)) continue
  const abs = path.join(root, file)
  let text
  try {
    text = fs.readFileSync(abs, 'utf8')
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

if (hits.length > 0) {
  console.error('Retired fixture terms found outside historical allowlist:')
  for (const hit of hits) console.error(`  - ${hit}`)
  process.exit(1)
}

console.log('check:retired-fixtures PASS')
console.log(`Allowlist (${HISTORICAL_ALLOWLIST.size} files):`)
for (const file of [...HISTORICAL_ALLOWLIST].sort()) console.log(`  - ${file}`)
