import type { Metadata } from 'next'
import { Suspense } from 'react'

import { LoginForm } from './LoginForm'

export const metadata: Metadata = {
  title: 'Login',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--paper-deep)] px-4 py-16">
      <div className="mx-auto max-w-md">
        <h1 className="display text-5xl">Sign in</h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Company Admin and Platform Admin access. Local seed credentials are documented in the
          README.
        </p>
        <Suspense fallback={<p className="mt-8">Loading login form…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
