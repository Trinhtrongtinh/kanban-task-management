import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/settings', '/workspaces', '/b'];
// Routes that authenticated users should NOT see (auth pages)
const AUTH_PREFIXES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read token from the Zustand-persisted localStorage key via cookie
  // Zustand persist stores as JSON string in localStorage under 'auth-storage'
  // We can't access localStorage in middleware, so we use a cookie set after login instead.
  // Check for token in the custom cookie we'll set on login.
  const token = request.cookies.get('auth-token')?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  // Not logged in → redirect to /login
  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Already logged in → redirect away from auth pages
  if (isAuthPage && token) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
