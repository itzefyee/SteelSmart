'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { getSupabaseClient } from '@/lib/supabase';
import AccountPageClient from '@/components/account/AccountPageClient';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { UserProfile } from '@/types';
import PageHero from '@/components/layout/PageHero';
import WireframeIconLayer from '@/components/layout/WireframeIconLayer';

export default function AccountPage() {
  const router = useRouter();
  const { user, profile: authProfile, loading: authLoading, isLoggingOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [profileRetryCount, setProfileRetryCount] = useState(0);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Retry profile loading if user exists but profile doesn't
  useEffect(() => {
    if (user && !authProfile && !authLoading && profileRetryCount < 5) {
      const timer = setTimeout(() => {
        setProfileRetryCount(prev => prev + 1);
        // Force a page refresh to trigger profile refetch
        window.location.reload();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user, authProfile, authLoading, profileRetryCount]);

  const accountIdentifier = user?.email ?? authProfile?.company ?? 'your account';

  // Show logging out spinner
  if (isLoggingOut) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Logging Out...</p>
        </div>
      </div>
    );
  }

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show error if profile failed to load
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Show loading if no profile yet (with helpful message for new users)
  if (!authProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {profileRetryCount > 0 
              ? 'Setting up your profile...' 
              : 'Loading your account...'}
          </p>
          {profileRetryCount > 2 && (
            <p className="mt-2 text-sm text-gray-500">
              This may take a moment for new accounts
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 home-wavy-bg relative overflow-hidden">
        <WireframeIconLayer />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
          <div className="mb-10">
            <PageHero
              align="left"
              eyebrow="Control Center"
              eyebrowPlacement="inline-after"
              title="My Account"
              theme="light"
              highlightPlacement="side"
              description={
                <>
                  Manage team access, billing, and every CAD, RFQ, and sourcing event linked to{' '}
                  <span className="font-semibold text-slate-900">{accountIdentifier}</span>.
                </>
              }
              highlights={[
                { label: 'Access', value: 'SSO' },
                { label: 'CAD Runs', value: 'Auto Sync' },
                { label: 'RFQs', value: 'Live Timeline' },
                { label: 'Support', value: '<24h' },
              ]}
            />
          </div>

          <AccountPageClient initialProfile={authProfile} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
