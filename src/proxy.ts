import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/webhooks') ||
    pathname === '/'

  if (isPublic) return NextResponse.next()

  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const user = session.user as { role?: string; isBanned?: boolean }

  if (user.isBanned) {
    const response = NextResponse.redirect(new URL('/login?reason=banned', request.url))
    response.cookies.delete('authjs.session-token')
    return response
  }

  const isAdminRoute =
    pathname.startsWith('/admin') || pathname.startsWith('/api/admin')

  if (isAdminRoute && user.role !== 'ADMIN') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/collection', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)'],
}
