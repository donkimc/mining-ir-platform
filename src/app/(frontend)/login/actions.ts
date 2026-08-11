'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { isPlatformAdmin } from '@/access'
import { getPayloadClient } from '@/lib/auth'
import { safeRedirectPath } from '@/lib/safe-redirect'

export type LoginState = {
  error?: string
}

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest?: unknown }).digest === 'string' &&
    String((error as { digest: string }).digest).startsWith('NEXT_REDIRECT')
  )
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const next = String(formData.get('next') || '').trim()

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const payload = await getPayloadClient()

  try {
    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })

    if (!result.token) {
      return { error: 'Login succeeded but no session token was issued.' }
    }

    const cookieStore = await cookies()
    cookieStore.set('payload-token', result.token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    if (isPlatformAdmin(result.user)) {
      redirect(safeRedirectPath(next, '/admin/tenants'))
    }

    redirect(safeRedirectPath(next, '/dashboard'))
  } catch (error) {
    if (isNextRedirect(error)) throw error
    return { error: 'Invalid credentials or inactive account.' }
  }
}
