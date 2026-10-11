import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Edge-level protection for protected dashboard and account routes
  const isProtected = pathname.startsWith('/admin') ||
                      pathname.startsWith('/vendor/dashboard') ||
                      pathname.startsWith('/account');

  if (isProtected) {
    const token = request.cookies.get('medox_token')?.value;

    if (!token) {
      const signInUrl = new URL('/signin', request.url);
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/vendor/dashboard/:path*',
    '/account/:path*',
  ],
};
