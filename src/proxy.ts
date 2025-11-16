import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Public API routes (no auth required)
  const publicApiRoutes = [
    '/api/auth',
    '/api/products',
    '/api/categories',
    '/api/webhooks',
  ];

  const isPublicApiRoute = publicApiRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // Protect API routes (except public ones)
  if (req.nextUrl.pathname.startsWith('/api') && !isPublicApiRoute) {
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }
  }

  // Protected page routes that require authentication
  const protectedPaths = [
    '/account',
    '/cad-generator',
    '/cad-analyzer',
    '/rfq',
    '/reports',
  ];

  const isProtectedPath = protectedPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  // Redirect to login if accessing protected route without session
  if (isProtectedPath && !session) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from login/signup pages
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|sample-drawings).*)',
  ],
};
