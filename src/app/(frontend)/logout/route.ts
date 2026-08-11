import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  cookieStore.delete('payload-token')

  const url = new URL('/login', request.url)
  return NextResponse.redirect(url, { status: 303 })
}

export async function POST(request: Request) {
  return GET(request)
}
