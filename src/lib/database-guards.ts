export type DatabaseGuardEnv = {
  NODE_ENV?: string
  NEXT_PHASE?: string
  PAYLOAD_DATABASE_PUSH?: string
  DATABASE_SSL_CA?: string
  DATABASE_SSL_REJECT_UNAUTHORIZED?: string
  /** @deprecated Removed in Sprint 3 — ignored. Preview/Production require DATABASE_SSL_CA. */
  ALLOW_INSECURE_DB_SSL?: string
  VERCEL_ENV?: string
  VERCEL?: string
}

function isVercelDeployed(env: DatabaseGuardEnv): boolean {
  return env.VERCEL === '1' || env.VERCEL_ENV === 'preview' || env.VERCEL_ENV === 'production'
}

function isProductionLike(env: DatabaseGuardEnv): boolean {
  return env.NODE_ENV === 'production' || isVercelDeployed(env)
}

export function assertProductionPushDisabled(env: DatabaseGuardEnv = process.env): void {
  if (env.PAYLOAD_DATABASE_PUSH === 'true' && isProductionLike(env)) {
    throw new Error(
      'PAYLOAD_DATABASE_PUSH=true is not allowed in Preview/Production. Set PAYLOAD_DATABASE_PUSH=false and run migrations.',
    )
  }
}

/** Opt-in push, always off during Next production build so schema cannot mutate at build time. */
export function resolveEnableDatabasePush(env: DatabaseGuardEnv = process.env): boolean {
  assertProductionPushDisabled(env)
  if (env.NEXT_PHASE === 'phase-production-build') return false
  return env.PAYLOAD_DATABASE_PUSH === 'true'
}

/**
 * Verified TLS for all Vercel Preview/Production deployments.
 * `ALLOW_INSECURE_DB_SSL` is ignored (Sprint 3 removed the hatch).
 * Local development may omit SSL; local `next build` against localhost may omit SSL.
 * `DATABASE_SSL_REJECT_UNAUTHORIZED=false` is never allowed when NODE_ENV=production or on Vercel.
 */
export function resolveDatabaseSsl(
  env: DatabaseGuardEnv = process.env,
): { ssl?: { ca?: string; rejectUnauthorized?: boolean } } {
  const ca = env.DATABASE_SSL_CA
  if (ca && ca.trim().length > 0) {
    return { ssl: { ca, rejectUnauthorized: true } }
  }

  if (env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false') {
    if (isProductionLike(env)) {
      throw new Error(
        'DATABASE_SSL_REJECT_UNAUTHORIZED=false is not allowed in Preview/Production. Set DATABASE_SSL_CA to the Supabase project CA PEM.',
      )
    }
    console.warn(
      '[payload] DATABASE_SSL_REJECT_UNAUTHORIZED=false — TLS certificate verification is disabled. Local/dev only; Preview and Production require DATABASE_SSL_CA.',
    )
    return { ssl: { rejectUnauthorized: false } }
  }

  if (isVercelDeployed(env)) {
    throw new Error(
      'DATABASE_SSL_CA is required on Vercel Preview/Production. Configure the Supabase project CA PEM (Dashboard → Database → SSL).',
    )
  }

  return {}
}
