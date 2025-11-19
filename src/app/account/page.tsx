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

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset state when user changes
  useEffect(() => {
    console.log('[Account Page] User changed:', user?.id);
    setProfile(null);
    setError(null);
    if (!authLoading) {
      setLoading(!!user); // Only show loading if there's a user to fetch
    }
  }, [user?.id, authLoading]);

  useEffect(() => {
    const fetchProfile = async () => {
      console.log('[Account Page] fetchProfile called', { authLoading, hasUser: !!user });
      
      // Wait for auth to finish loading
      if (authLoading) {
        console.log('[Account Page] Auth still loading, waiting...');
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

      // Fetch profile data
      try {
        console.log('[Account Page] Fetching profile for user:', user.id);
        const supabase = getSupabaseClient();
        
        console.log('[Account Page] Executing Supabase query...');
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        console.log('[Account Page] Query completed. Data:', data, 'Error:', error);

        if (error) {
          console.error('[Account Page] Profile fetch error:', error);
          
          // If profile doesn't exist, create one
          if (error.code === 'PGRST116') {
            console.log('[Account Page] Profile not found, creating new profile...');
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
            
            console.log('[Account Page] Profile created successfully:', newProfile);
            setProfile(newProfile as UserProfile);
            setLoading(false);
            return;
          }
          
          throw error;
        }
        
        console.log('[Account Page] Profile fetched successfully:', data);
        setProfile(data as UserProfile);
      } catch (err) {
        console.error('[Account Page] Error fetching profile:', err);
        setError(`Failed to load profile: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        console.log('[Account Page] Setting loading to false');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, router]);

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
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
            <p className="mt-2 text-gray-600">
              Manage your profile, view your CAD generation history, and track your activity
            </p>
          </div>

          <AccountPageClient initialProfile={profile} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
