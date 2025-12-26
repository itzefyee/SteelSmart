'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, type Database } from '@/lib/supabase';
import { UserProfile, UserMetadata } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isLoggingOut: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: UserMetadata) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  isLoggingOut: false,
  isAdmin: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  updateProfile: async () => ({ error: null }),
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const supabase = getSupabaseClient();

  // Fetch user profile from database with retry logic
  const fetchProfile = async (userId: string, retryCount = 0): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist and we haven't retried much, wait and retry
        if (error.code === 'PGRST116' && retryCount < 3) {
          console.log(`Profile not found, retrying in ${(retryCount + 1) * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
          return fetchProfile(userId, retryCount + 1);
        }
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  // Force refresh profile data (clears cache)
  const refreshProfile = async (): Promise<void> => {
    if (!user) return;
    
    console.log('🔄 Force refreshing profile data...');
    const freshProfile = await fetchProfile(user.id);
    setProfile(freshProfile);
  };

  useEffect(() => {
    // Get initial user - more secure than getSession()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      
      // Reset logging out state on initial load
      setIsLoggingOut(false);
      
      // Fetch profile if user is authenticated
      if (user) {
        const userProfile = await fetchProfile(user.id);
        setProfile(userProfile);
      }
      
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting user:', error);
      setIsLoggingOut(false); // Reset on error too
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      // Reset logging out state on any auth change
      setIsLoggingOut(false);
      
      // For SIGNED_IN event, verify user with getUser()
      if (event === 'SIGNED_IN' && session) {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          const userProfile = await fetchProfile(user.id);
          setProfile(userProfile);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      } else {
        // For other events, use session user but be aware it's from storage
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const userProfile = await fetchProfile(session.user.id);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, metadata?: UserMetadata) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      // Set logging out state
      setIsLoggingOut(true);
      
      // Sign out from Supabase and wait for completion
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase signOut error:', error);
        // Even if signOut fails, clear local state and redirect
      }
      
      // Clear local state immediately
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsLoggingOut(false);
      
      // Wait a moment for auth state to propagate to cookies
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Redirect to homepage with stay parameter to prevent admin redirect
      window.location.replace('/?stay=true');
    } catch (error) {
      console.error('SignOut error:', error);
      // Still clear local state and redirect even if there's an error
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsLoggingOut(false);
      
      // Wait and redirect even on error
      await new Promise(resolve => setTimeout(resolve, 200));
      window.location.replace('/?stay=true');
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) {
        return { error: new Error('No user logged in') };
      }

      // Build update object with only allowed fields
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.company !== undefined) {
        updateData.company = updates.company;
      }

      if (updates.phone !== undefined) {
        updateData.phone = updates.phone;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        return { error: error as Error };
      }

      // Force refresh profile data after update
      await refreshProfile();

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    isLoggingOut,
    isAdmin: profile?.Role?.toLowerCase() === 'admin',
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
