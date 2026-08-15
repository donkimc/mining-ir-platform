import { NextResponse } from 'next/server'

import { clearPayloadAuthCookie } from '@/lib/auth-cookies'

export async function GET(request: Request) {
  await clearPayloadAuthCookie()

  const url = new URL('/login', request.url)
  return NextResponse.redirect(url, { status: 303 })
}

export async function POST(request: Request) {
  return GET(request)
}
