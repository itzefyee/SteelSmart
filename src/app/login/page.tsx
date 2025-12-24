'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TechnicalPattern from '@/components/TechnicalPattern';
import BlueprintSketchLayer from '@/components/BlueprintSketchLayer';
import { useLoginAudit } from '@/hooks/useLoginAudit';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const router = useRouter();
  const { logLoginSuccess } = useLoginAudit();

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

      // Audit log: Login success
      await logLoginSuccess();

      // Wait for auth state to update and get user profile
      let attempts = 0;
      const maxAttempts = 20; // Increased attempts
      
      const checkProfileAndRedirect = async () => {
        attempts++;
        
        try {
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
              // Check if user is admin first - admins always go to /admin
              if (profile.Role?.toLowerCase() === 'admin') {
                window.location.href = '/admin';
                return;
              }
              
              // For non-admin users, check for redirect parameter
              const urlParams = new URLSearchParams(window.location.search);
              const redirectTo = urlParams.get('redirectTo');
              
              if (redirectTo) {
                // If there's a specific redirect for non-admin users, use it
                router.push(redirectTo);
              } else {
                // Default redirect for non-admin users
                window.location.href = '/';
              }
              return;
            }
          }
        } catch (err) {
          console.warn('Error checking profile:', err);
        }
        
        // If we haven't succeeded and haven't hit max attempts, try again
        if (attempts < maxAttempts) {
          setTimeout(checkProfileAndRedirect, 250);
        } else {
          // Fallback: redirect to home after max attempts
          console.warn('Could not determine user role, redirecting to home');
          window.location.href = '/';
        }
      };
      
      // Start checking after a brief delay to let auth state settle
      setTimeout(checkProfileAndRedirect, 100);
      
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
      
      {/* Back to Main Page Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-colors border border-white/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Main Page
        </Link>
      </div>

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
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
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
