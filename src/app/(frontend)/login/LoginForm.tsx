'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { FormMessage } from '@/components/ui/FormMessage'
import { loginAction, type LoginState } from './actions'

const initialState: LoginState = {}

export function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || ''
  const unauthorized = searchParams.get('error') === 'unauthorized'
  const multiTenant = searchParams.get('error') === 'multi-tenant'
  const [state, formAction, pending] = useActionState(loginAction, initialState)

  return (
    <form action={formAction} className="panel mx-auto mt-10 max-w-md space-y-4">
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
      <FormMessage type="error" message={state.error} />
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
