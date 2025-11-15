import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // API routes that don't require authentication
  const publicApiRoutes = [
    '/api/auth',
    '/api/generate-cad', // Allow public CAD generation (consider changing in production)
    '/api/analyze-drawing', // Allow public drawing analysis (consider changing in production)
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

  // Redirect authenticated users away from login/signup pages
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // For protected routes, redirect to login if not authenticated
  // Uncomment below if you want to protect certain pages
  /*
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  */

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
