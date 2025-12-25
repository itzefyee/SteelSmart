'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function Loading() {
  // Try to get auth context, but handle cases where it might not be available
  let isLoggingOut = false;
  try {
    const auth = useAuth();
    isLoggingOut = auth.isLoggingOut;
  } catch {
    // AuthProvider might not be available in some contexts
    isLoggingOut = false;
  }

  // Try to get pathname to determine the page type
  let pathname = '';
  try {
    pathname = usePathname() || '';
  } catch {
    // usePathname might not be available in some contexts
    pathname = '';
  }

  // Skip loading screen for admin routes - they should load instantly
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const isCatalogPage = pathname.startsWith('/catalog');

  // If it's a catalog page, use the catalog design
  if (isCatalogPage) {
    return (
      <div className="min-h-screen flex flex-col catalog-shell">
        <Header />
        <main className="flex-1 relative">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20 text-slate-100">
            <div className="catalog-glass-container p-8 mb-12 bg-white/95 text-slate-900 shadow-[0_35px_120px_rgba(15,23,42,0.45)]">
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-blue-600 border-r-transparent" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                  <p className="mt-4 text-slate-600">Loading...</p>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Default loading screen for other pages
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {/* Inline spinner to avoid import issues */}
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-blue-600 border-r-transparent" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="mt-4 text-gray-600">
          {isLoggingOut ? 'Logging Out...' : 'Loading SteelSmart...'}
        </p>
        {!isLoggingOut && (
          <p className="mt-2 text-sm text-gray-500">
            First load may take a moment while we prepare everything
          </p>
        )}
      </div>
    </div>
  );
}