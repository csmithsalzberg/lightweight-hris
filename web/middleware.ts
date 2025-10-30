import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Allow unauthenticated access to auth routes and static assets
const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/api/auth/',
  '/_next/',
  '/favicon',
  '/assets/',
  '/public/',
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const hasSession = Boolean(req.cookies.get('session')?.value);
  if (hasSession) return NextResponse.next();

  // API routes: return 401 JSON
  if (pathname.startsWith('/api/')) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Pages: redirect to login
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};


