import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from './lib/database.types';

export async function proxy(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Get authenticated user - more secure than getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if accessing admin routes
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  const isAdminApiRoute = req.nextUrl.pathname.startsWith('/api/admin');

  // Get user role if user exists
  let userRole: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('Role')
      .eq('id', user.id)
      .single();
    
    userRole = profile?.Role || null;
  }

  // Protect admin routes - require authentication AND admin role
  if (isAdminRoute || isAdminApiRoute) {
    if (!user) {
      if (isAdminApiRoute) {
        return NextResponse.json(
          { error: 'Unauthorized - Please sign in' },
          { status: 401 }
        );
      }
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if user has admin role (case-insensitive)
    if (userRole?.toLowerCase() !== 'admin') {
      if (isAdminApiRoute) {
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        );
      }
      // Redirect non-admin users to homepage with error message
      const redirectUrl = new URL('/', req.url);
      redirectUrl.searchParams.set('error', 'admin_access_required');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Public API routes (no auth required)
  const publicApiRoutes = [
    '/api/auth',
    '/api/products',
    '/api/categories',
    '/api/webhooks',
    '/api/recommendations',
  ];

  const isPublicApiRoute = publicApiRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // Protect API routes (except public ones and admin routes already handled)
  if (req.nextUrl.pathname.startsWith('/api') && !isPublicApiRoute && !isAdminApiRoute) {
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }
  }

  // Protected page routes that require authentication (customer routes)
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

  // Redirect to login if accessing protected route without user
  if (isProtectedPath && !user) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from login/signup pages
  if (user && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
    // Prevent redirect loops by checking if we're already being redirected
    const redirectTo = req.nextUrl.searchParams.get('redirectTo');
    if (redirectTo) {
      // If there's a redirectTo param, use it
      return NextResponse.redirect(new URL(redirectTo, req.url));
    }
    // Redirect admin users to admin dashboard, regular users to homepage
    const redirectUrl = userRole?.toLowerCase() === 'admin' ? '/admin' : '/';
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  // Redirect admin users from homepage to admin dashboard (but allow manual override)
  if (user && userRole?.toLowerCase() === 'admin' && req.nextUrl.pathname === '/' && !req.nextUrl.searchParams.has('stay')) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  return response;
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
