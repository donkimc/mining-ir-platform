const ALLOWED_NEXT_PATHS = new Set([
  '/',
  '/projects',
  '/news',
  '/documents',
  '/management',
  '/share-structure',
  '/investors',
  '/corporate',
  '/contact',
  '/dashboard',
  '/dashboard/company',
  '/dashboard/projects',
  '/dashboard/projects/new',
  '/dashboard/news',
  '/dashboard/news/new',
  '/dashboard/documents',
  '/dashboard/documents/new',
  '/dashboard/management',
  '/dashboard/management/new',
  '/dashboard/share-structure',
  '/dashboard/share-structure/new',
  '/dashboard/exploration',
  '/dashboard/exploration/new',
  '/admin/tenants',
  '/admin/users',
])

/** Reject open redirects: protocol-relative (`//`), backslash tricks, and unknown paths. */
export function safeRedirectPath(next: string, fallback: string): string {
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return fallback
  }
  if (next.includes('\\') || next.includes('://')) {
    return fallback
  }

  const pathOnly = next.split(/[?#]/, 1)[0]
  if (ALLOWED_NEXT_PATHS.has(pathOnly)) {
    return next
  }
  if (/^\/projects\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pathOnly)) {
    return next
  }
  if (/^\/news\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pathOnly)) {
    return next
  }
  if (
    /^\/dashboard\/(projects|news|documents|management|share-structure|exploration)\/[^/]+$/.test(
      pathOnly,
    )
  ) {
    return next
  }
  if (/^\/dashboard\/documents\/[^/]+\/file$/.test(pathOnly)) {
    return next
  }
  return fallback
}
