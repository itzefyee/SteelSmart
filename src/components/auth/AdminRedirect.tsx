'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface AdminRedirectProps {
  children: React.ReactNode;
}

/**
 * Component that automatically redirects admin users to the admin dashboard
 * and shows customer content for regular users
 */
export function AdminRedirect({ children }: AdminRedirectProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  
  // Safely get auth data with fallbacks
  let user = null;
  let profile = null;
  let loading = true;
  
  try {
    const authData = useAuth();
    user = authData?.user || null;
    profile = authData?.profile || null;
    loading = authData?.loading ?? true;
  } catch (error) {
    console.error('Error accessing auth context:', error);
    // Fallback to showing content if auth context fails
    loading = false;
  }

  useEffect(() => {
    // Only redirect if we have complete auth data and router is available
    if (!loading && user && profile && router && !isRedirecting) {
      if (profile.Role?.toLowerCase() === 'admin') {
        setIsRedirecting(true);
        // Add a small delay to show the redirect message
        setTimeout(() => {
          try {
            router.push('/admin');
          } catch (error) {
            console.error('Error redirecting to admin:', error);
            setIsRedirecting(false);
          }
        }, 1000);
      }
    }
  }, [user, profile, loading, router, isRedirecting]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting admin users
  if ((user && profile?.Role?.toLowerCase() === 'admin') || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Redirecting to admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Show customer content for non-admin users or if auth context failed
  return <>{children}</>;
}