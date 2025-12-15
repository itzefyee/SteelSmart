import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

/**
 * Hook to handle role-based redirects
 * @param redirectAdminTo - Where to redirect admin users (default: '/admin')
 * @param redirectCustomerTo - Where to redirect customer users (default: '/')
 */
export function useRoleRedirect(
  redirectAdminTo: string = '/admin',
  redirectCustomerTo: string = '/'
) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && profile) {
      const userRole = profile.Role?.toLowerCase();
      
      if (userRole === 'admin') {
        router.push(redirectAdminTo);
      } else {
        // Only redirect customers if we're not already on the customer page
        if (redirectCustomerTo !== '/' || window.location.pathname !== '/') {
          router.push(redirectCustomerTo);
        }
      }
    }
  }, [user, profile, loading, router, redirectAdminTo, redirectCustomerTo]);

  return {
    user,
    profile,
    loading,
    isAdmin: profile?.Role?.toLowerCase() === 'admin',
    isCustomer: profile?.Role?.toLowerCase() === 'customer' || !profile?.Role,
  };
}