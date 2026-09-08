/**
 * Content-Security-Policy values applied via next.config.ts.
 *
 * Public / dashboard routes use a stricter policy (no `'unsafe-eval'`).
 * Payload CMS (`/cms`) keeps `'unsafe-eval'` for admin tooling compatibility.
 *
 * Residual risk: both policies still allow `'unsafe-inline'` for script/style
 * because this app does not yet ship a nonce-based CSP pipeline for Next.js
 * App Router inline bootstraps. See docs/SECURITY.md.
 */

const SHARED_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  // S4-1: allow the illustrative OSM project map embed only (not a wildcard).
  'frame-src https://www.openstreetmap.org',
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' https:",
  "object-src 'none'",
] as const

/** Stricter CSP for public tenant pages and non-CMS app routes. */
export const PUBLIC_CONTENT_SECURITY_POLICY = [
  ...SHARED_DIRECTIVES,
  "script-src 'self' 'unsafe-inline'",
].join('; ')

/** Broader CSP for Payload CMS admin UI (`/cms`). */
export const ADMIN_CONTENT_SECURITY_POLICY = [
  ...SHARED_DIRECTIVES,
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
].join('; ')

/**
 * @deprecated Prefer PUBLIC_CONTENT_SECURITY_POLICY or ADMIN_CONTENT_SECURITY_POLICY.
 * Retained as the public (default) policy for existing regression imports.
 */
export const CONTENT_SECURITY_POLICY = PUBLIC_CONTENT_SECURITY_POLICY
