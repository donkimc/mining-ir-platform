import { cookies, headers } from 'next/headers'

/** Payload default token lifetime (seconds). */
export const PAYLOAD_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 2

/**
 * Prefer the actual request protocol over NODE_ENV.
 * `next start` sets NODE_ENV=production while still serving http://localhost,
 * and browsers discard Secure cookies on HTTP — which looks like "login works
 * once then every nav kicks me to /login".
 */
export function shouldUseSecureAuthCookie(args: {
  forwardedProto: string | null
  serverUrl: string | undefined
}): boolean {
  if (args.forwardedProto === 'https') return true
  if (args.forwardedProto === 'http') return false
  if (args.serverUrl?.startsWith('https://')) return true
  if (args.serverUrl?.startsWith('http://')) return false
  // Last resort: prefer a working HTTP session over Secure-on-HTTP breakage.
  return false
}

export async function getAuthCookieOptions(): Promise<{
  httpOnly: true
  path: '/'
  sameSite: 'lax'
  secure: boolean
  maxAge: number
}> {
  const headerStore = await headers()
  const secure = shouldUseSecureAuthCookie({
    forwardedProto: headerStore.get('x-forwarded-proto'),
    serverUrl: process.env.NEXT_PUBLIC_SERVER_URL,
  })

  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure,
    maxAge: PAYLOAD_TOKEN_MAX_AGE_SECONDS,
  }
}

export async function setPayloadAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('payload-token', token, await getAuthCookieOptions())
}

export async function clearPayloadAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  const options = await getAuthCookieOptions()
  // Match path/secure/sameSite so browsers actually clear the stored cookie.
  cookieStore.set('payload-token', '', {
    ...options,
    maxAge: 0,
  })
}
