/**
 * Ops: unlock staging admin users and rotate their passwords.
 *
 * When to use:
 * - Staging Company Admin / Platform Admin are locked (too many failed logins), or
 * - Staging passwords were rotated elsewhere and need a controlled reset.
 *
 * Safe only against Supabase staging (`jthotkkremiesvocfsmr`). Refuses localhost
 * and the empty real Production project (`bwftfsfbiyzgwztwtqmh`).
 *
 * Usage:
 *   npx tsx scripts/unlock-staging-users.ts
 *
 * Loads `.env.staging.local` (gitignored) with dotenv for PEM `\n` expansion.
 * Prints new passwords once to stdout — store in a password manager; never commit.
 */
import { randomBytes } from 'crypto'
import { config as loadEnv } from 'dotenv'
import { existsSync } from 'fs'
import path from 'path'

const TARGETS = [
  { email: 'admin@auroragold.staging', label: 'Company Admin' },
  { email: 'platform@mining-ir.staging', label: 'Platform Admin' },
] as const

function generatePassword(): string {
  // URL-safe-ish, high entropy, no ambiguous punctuation for copy/paste
  return `Stg-${randomBytes(18).toString('base64url')}!`
}

function loadStagingEnv(): void {
  const stagingPath = path.resolve(process.cwd(), '.env.staging.local')
  if (!existsSync(stagingPath)) {
    throw new Error(
      'Missing .env.staging.local. Create it from Vercel/Supabase staging secrets (gitignored).',
    )
  }
  // override:true so a leftover shell DATABASE_URI=localhost cannot win
  const result = loadEnv({ path: stagingPath, override: true })
  if (result.error) {
    throw result.error
  }
}

async function main() {
  loadStagingEnv()

  const uri = process.env.DATABASE_URI || ''
  if (!uri.startsWith('postgres')) {
    throw new Error(
      'DATABASE_URI is missing or not a postgres URL in .env.staging.local',
    )
  }

  const host = uri.includes('@') ? uri.split('@').slice(-1)[0].split('/')[0].split(':')[0] : ''
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    throw new Error(
      `Refusing to run against non-staging host: ${host || '(empty)'}. ` +
        'Load .env.staging.local (or Vercel production env) and ensure .env.local is not overriding it.',
    )
  }
  if (uri.includes('bwftfsfbiyzgwztwtqmh')) {
    throw new Error('Refusing to modify the empty real Production Supabase project.')
  }
  // Pooler hostnames omit the project ref; require the known staging ref somewhere in the URI.
  if (!uri.includes('jthotkkremiesvocfsmr')) {
    throw new Error(
      `Refusing to run against unexpected database (host=${host}). Expected staging project ref in DATABASE_URI.`,
    )
  }

  // Ensure Payload does not attempt schema push during this ops script.
  process.env.PAYLOAD_DATABASE_PUSH = 'false'

  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })

  console.log(`Connected host=${host}`)
  console.log('Unlocking and rotating passwords for staging users…')

  const results: Array<{ label: string; email: string; password: string; id: string | number }> = []

  for (const target of TARGETS) {
    const found = await payload.find({
      collection: 'users',
      where: { email: { equals: target.email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const user = found.docs[0]
    if (!user) {
      throw new Error(`User not found: ${target.email}`)
    }

    const password = generatePassword()
    const updated = await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        password,
        loginAttempts: 0,
        lockUntil: null,
        status: 'active',
      },
      overrideAccess: true,
    })

    results.push({
      label: target.label,
      email: target.email,
      password,
      id: updated.id,
    })
    console.log(`Updated ${target.label} <${target.email}> id=${updated.id} (unlocked)`)
  }

  console.log('\n=== Store these in your password manager (shown once) ===')
  for (const row of results) {
    console.log(`${row.label}: ${row.email} / ${row.password}`)
  }
  console.log('=== end ===\n')

  process.exit(0)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
