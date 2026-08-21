/**
 * Report which deployment env vars are present without printing secret values.
 *
 * Usage:
 *   npm run check:env
 *   # or against staging secrets:
 *   dotenv -e .env.staging.local -- npm run check:env
 *
 * Loads `.env.local`, then `.env.staging.local`, then `.env` (later files do not
 * override earlier ones — same pattern as other ops scripts).
 */
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env.staging.local' })
loadEnv({ path: '.env' })

const REQUIRED = [
  'DATABASE_URI',
  'DATABASE_SSL_CA',
  'PAYLOAD_SECRET',
  'NEXT_PUBLIC_SERVER_URL',
  'PAYLOAD_DATABASE_PUSH',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'S3_REGION',
  'S3_ENDPOINT',
] as const

/** Local/script-only (ADR-0016). Must be absent from Vercel Preview/Production. */
const LOCAL_ONLY = ['DEFAULT_TENANT_SLUG'] as const

function isPresent(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function parseDatabaseUri(uri: string): {
  username: string
  host: string
  port: string
  passwordLength: number
} | null {
  try {
    const normalized = uri.replace(/^postgresql:/i, 'postgres:')
    const url = new URL(normalized)
    return {
      username: decodeURIComponent(url.username || '(none)'),
      host: url.hostname || '(none)',
      port: url.port || '(default)',
      passwordLength: decodeURIComponent(url.password || '').length,
    }
  } catch {
    return null
  }
}

function main(): void {
  let missing = 0
  const warnings: string[] = []

  console.log('Environment preflight (values never printed)\n')

  for (const key of REQUIRED) {
    const value = process.env[key]
    const present = isPresent(value)
    if (!present) missing += 1
    console.log(`${key}: ${present ? 'PRESENT' : 'MISSING'}`)

    if (key === 'DATABASE_URI' && present && value) {
      const parsed = parseDatabaseUri(value)
      if (!parsed) {
        warnings.push('DATABASE_URI could not be parsed as a URL')
      } else {
        console.log(
          `  summary: ${parsed.username} @ ${parsed.host}:${parsed.port} (password length ${parsed.passwordLength})`,
        )

        if (!/^postgres\.[A-Za-z0-9]+$/.test(parsed.username)) {
          warnings.push(
            'DATABASE_URI username is not in postgres.<project-ref> form (Supabase pooler user). Direct "postgres" users often fail on the transaction pooler.',
          )
        }

        if (parsed.host.startsWith('db.') && parsed.host.endsWith('.supabase.co') && parsed.port === '6543') {
          warnings.push(
            'DATABASE_URI uses db.<ref>.supabase.co with port 6543 — that mix is invalid (direct host is 5432; pooler host is *.pooler.supabase.com:6543).',
          )
        }
      }
    }

    if (key === 'PAYLOAD_DATABASE_PUSH' && present && value?.trim() === 'true') {
      warnings.push(
        'PAYLOAD_DATABASE_PUSH is "true" — Preview/Production must keep this false or unset so schema push cannot run.',
      )
    }
  }

  for (const key of LOCAL_ONLY) {
    const value = process.env[key]
    const present = isPresent(value)
    console.log(`${key}: ${present ? 'PRESENT' : 'MISSING'} (local/script-only)`)
    if (
      present &&
      (process.env.VERCEL === '1' ||
        process.env.VERCEL_ENV === 'preview' ||
        process.env.VERCEL_ENV === 'production')
    ) {
      warnings.push(
        `${key} must be absent from Vercel Preview/Production — hostname routing resolves tenants (ADR-0016).`,
      )
    }
  }

  if (warnings.length > 0) {
    console.log('\nWarnings:')
    for (const warning of warnings) {
      console.log(`- ${warning}`)
    }
  }

  if (missing > 0) {
    console.error(`\nFAIL: ${missing} required variable(s) missing`)
    process.exit(1)
  }

  console.log('\nPASS: all required variables present')
  process.exit(0)
}

main()
