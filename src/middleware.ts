import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { AUTH_COOKIE_NAME } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Static asset and internal next paths that should always bypass middleware
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/screenshot') ||
    pathname.startsWith('/preview') ||
    pathname === '/favicon.ico' ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  // 2. Public auth API endpoints
  if (pathname.startsWith('/api/auth/')) {
    // Note: /api/auth/me is also handled by its own route handler with getCurrentUser
    return NextResponse.next();
  }

  // 3. Public auth pages
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/verify-email' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';

  // Check auth cookie
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  let user = null;

  if (token) {
    user = await verifyAuthToken(token);
  }

  // If visiting an auth page (login/register) while already authenticated -> redirect to dashboard
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If visiting an auth page while not authenticated -> allow
  if (isAuthPage) {
    return NextResponse.next();
  }

  // If not authenticated and attempting to access protected area
  if (!user) {
    // If it's an API route, return 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to access this resource.' },
        { status: 401 }
      );
    }

    // Otherwise redirect to /login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user accessing protected route -> proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
