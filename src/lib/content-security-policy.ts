/**
 * Content-Security-Policy value applied to all routes via next.config.ts.
 * Exported for regression tests (S4-1 frame-src for the OSM map embed).
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  // S4-1: allow the illustrative OSM project map embed only (not a wildcard).
  'frame-src https://www.openstreetmap.org',
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self' https:",
  "object-src 'none'",
].join('; ')
