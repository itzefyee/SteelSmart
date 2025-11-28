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
  const { user, profile: authProfile, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!loading) {
      sessionStorage.removeItem('accountForceReloaded');
      return;
    }

    const alreadyForced = sessionStorage.getItem('accountForceReloaded');
    const timeout = window.setTimeout(() => {
      if (sessionStorage.getItem('accountForceReloaded') === 'true') {
        return;
      }
      if (loading) {
        sessionStorage.setItem('accountForceReloaded', 'true');
        window.location.reload();
      }
    }, 2000);

    return () => {
      window.clearTimeout(timeout);
      if (!loading && alreadyForced) {
        sessionStorage.removeItem('accountForceReloaded');
      }
    };
  }, [loading]);

  useEffect(() => {
    const initializeProfile = async () => {
      console.log('[Account Page] Initializing', { authLoading, hasUser: !!user, hasAuthProfile: !!authProfile });
      
      // Wait for auth to finish loading
      if (authLoading) {
        console.log('[Account Page] Auth still loading...');
        setLoading(true);
        return;
      }
      
      // If no user after auth loads, redirect to home
      if (!user) {
        console.log('[Account Page] No user found, redirecting to home');
        const isLogout = sessionStorage.getItem('isLoggingOut');
        if (!isLogout) {
          router.push('/');
        }
        setLoading(false);
        return;
      }

      // If we already have the profile from auth context, use it
      if (authProfile && !profile) {
        console.log('[Account Page] Using profile from auth context');
        setProfile(authProfile);
        setLoading(false);
        return;
      }

      // If we already set the profile locally, don't fetch again
      if (profile) {
        console.log('[Account Page] Profile already set locally');
        setLoading(false);
        return;
      }

      // Fetch profile data as fallback
      try {
        console.log('[Account Page] Fetching profile for user:', user.id);
        setLoading(true);
        setError(null);
        
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        console.log('[Account Page] Query completed. Data:', !!data, 'Error:', error?.code);

        if (error) {
          // If profile doesn't exist, create one
          if (error.code === 'PGRST116') {
            console.log('[Account Page] Profile not found, creating...');
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();
            
            if (createError) {
              console.error('[Account Page] Failed to create profile:', createError);
              throw createError;
            }
            
            console.log('[Account Page] Profile created successfully');
            setProfile(newProfile as UserProfile);
          } else {
            throw error;
          }
        } else {
          console.log('[Account Page] Profile fetched successfully');
          setProfile(data as UserProfile);
        }
      } catch (err) {
        console.error('[Account Page] Error:', err);
        setError(`Failed to load profile: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    initializeProfile();
  }, [user?.id, authLoading, authProfile, router]);

  const accountIdentifier = user?.email ?? profile?.company ?? 'your account';

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load profile'}</p>
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

          <AccountPageClient initialProfile={profile} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
