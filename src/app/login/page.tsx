'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TechnicalPattern from '@/components/TechnicalPattern';
import BlueprintSketchLayer from '@/components/BlueprintSketchLayer';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // Let AuthProvider handle the auth state change
      // The onAuthStateChange listener will update user and profile
      // We'll redirect after the auth state is properly set
      
      // Check for redirect parameter first
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirectTo');
      
      if (redirectTo) {
        router.push(redirectTo);
        return;
      }

      // Wait for auth state to update, then redirect based on role
      // Use a more reliable approach with polling
      let attempts = 0;
      const maxAttempts = 10;
      
      const checkAuthAndRedirect = async () => {
        attempts++;
        
        const { getSupabaseClient } = await import('@/lib/supabase');
        const supabase = getSupabaseClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('Role')
            .eq('id', user.id)
            .single();
          
          if (!profileError && profile) {
            // Successfully got profile, redirect based on role
            if (profile.Role?.toLowerCase() === 'admin') {
              router.push('/admin');
            } else {
              router.push('/');
            }
            return;
          }
        }
        
        // If we haven't succeeded and haven't hit max attempts, try again
        if (attempts < maxAttempts) {
          setTimeout(checkAuthAndRedirect, 200);
        } else {
          // Fallback: redirect to home after max attempts
          console.warn('Could not determine user role, redirecting to home');
          router.push('/');
        }
      };
      
      // Start checking after a brief delay to let auth state settle
      setTimeout(checkAuthAndRedirect, 100);
      
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[110vh] flex items-center justify-center relative bg-gradient-to-br from-primary via-blue-600 to-blue-700 overflow-hidden px-4 py-12">
      <TechnicalPattern />
      <div className="absolute inset-0 bg-black/30"></div>
      <BlueprintSketchLayer variant="hero" />
      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your SteelSmart account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-white/80 text-sm mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
