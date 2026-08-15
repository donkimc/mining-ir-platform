'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

import { FormMessage } from '@/components/ui/FormMessage'
import { safeRedirectPath } from '@/lib/safe-redirect'

/**
 * Login via Payload's `/api/users/login` so Set-Cookie is a normal HTTP response.
 * Server-action cookie + redirect is fragile under `next start` on HTTP (Secure flag)
 * and can look like "logged in, then every nav kicks me out".
 */
export function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || ''
  const unauthorized = searchParams.get('error') === 'unauthorized'
  const multiTenant = searchParams.get('error') === 'multi-tenant'
  const [error, setError] = useState<string | undefined>()
  const [pending, startTransition] = useTransition()

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(undefined)

    const form = event.currentTarget
    const formData = new FormData(form)
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')

    if (!email || !password) {
      setError('Email and password are required.')
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        })

        const data = (await response.json().catch(() => null)) as {
          message?: string
          user?: { platformRole?: string | null }
          errors?: Array<{ message?: string }>
        } | null

        if (!response.ok) {
          setError(data?.errors?.[0]?.message || 'Invalid credentials or inactive account.')
          return
        }

        const isPlatform = data?.user?.platformRole === 'platform_admin'
        const destination = safeRedirectPath(
          next,
          isPlatform ? '/admin/tenants' : '/dashboard',
        )
        // Full page load so layouts authenticate with the committed cookie.
        window.location.href = destination
      } catch {
        setError('Invalid credentials or inactive account.')
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="panel mx-auto mt-10 max-w-md space-y-4">
      <input type="hidden" name="next" value={next} />
      {unauthorized ? (
        <FormMessage type="error" message="You are not authorized for that area." />
      ) : null}
      {multiTenant ? (
        <FormMessage
          type="error"
          message="This account has Company Admin access to more than one tenant. Contact a Platform Admin to resolve memberships before using the dashboard."
        />
      ) : null}
      <FormMessage type="error" message={error} />
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-semibold">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="input"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-semibold">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
        />
      </div>
      <button type="submit" className="btn btn-dark w-full" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-sm text-[var(--ink-soft)]">
        <Link href="/">Back to public site</Link>
      </p>
    </form>
  )
}
