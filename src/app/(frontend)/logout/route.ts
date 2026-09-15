import { NextResponse } from 'next/server'

import { clearPayloadAuthCookie } from '@/lib/auth-cookies'
import { absoluteAppUrl } from '@/lib/request-url'

export async function GET(request: Request) {
  await clearPayloadAuthCookie()

  // Do not use `request.url` alone — on Railway it can be https://localhost:8080/...
  return NextResponse.redirect(absoluteAppUrl(request, '/login'), { status: 303 })
}

export async function POST(request: Request) {
  return GET(request)
}
