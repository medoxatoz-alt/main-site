import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Edge-level protection for protected dashboard and account routes
  const isProtected = pathname.startsWith('/admin') ||
                      pathname.startsWith('/vendor/dashboard') ||
                      pathname.startsWith('/account');

  // UX-only guard: the API enforces authorization on every request. The
  // marker cookie (set by saveToken) just says "signed in"; medox_token is
  // still accepted so sessions from before the marker existed aren't bounced.
  if (isProtected) {
    const signedIn = request.cookies.get('medox_session')?.value || request.cookies.get('medox_token')?.value;

    if (!signedIn) {
      const signInUrl = new URL('/signin', request.url);
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

// Backwards-compatible export
export const middleware = proxy;

export const config = {
  matcher: [
    '/admin/:path*',
    '/vendor/dashboard/:path*',
    '/account/:path*',
  ],
};
