'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

interface AccountStatsSectionProps {
  userId: string;
  memberSince: string | null;
}

interface Stats {
  totalCADGenerations: number;
  totalRFQs: number;
  totalAnalyses: number;
}

export default function AccountStatsSection({ userId, memberSince }: AccountStatsSectionProps) {
  const [stats, setStats] = useState<Stats>({
    totalCADGenerations: 0,
    totalRFQs: 0,
    totalAnalyses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabaseClient();
        
        // Fetch CAD generations count
        const { count: cadCount, error: cadError } = await supabase
          .from('cad_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (cadError) throw cadError;

        // Fetch RFQ submissions count
        const { count: rfqCount, error: rfqError } = await supabase
          .from('rfq_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (rfqError) throw rfqError;

        // Fetch drawing analyses count
        const { count: analysesCount, error: analysesError } = await supabase
          .from('drawing_analyses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (analysesError) throw analysesError;

        setStats({
          totalCADGenerations: cadCount || 0,
          totalRFQs: rfqCount || 0,
          totalAnalyses: analysesCount || 0,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Statistics</h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Statistics</h2>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Statistics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CAD Generations */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">CAD Generations</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalCADGenerations}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* RFQ Submissions */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">RFQ Submissions</p>
              <p className="text-3xl font-bold text-green-900">{stats.totalRFQs}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Drawing Analyses */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">Drawing Analyses</p>
              <p className="text-3xl font-bold text-purple-900">{stats.totalAnalyses}</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <svg
                className="h-6 w-6 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Member Since */}
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600 mb-1">Member Since</p>
              <p className="text-lg font-bold text-amber-900">{formatDate(memberSince)}</p>
            </div>
            <div className="bg-amber-100 rounded-full p-3">
              <svg
                className="h-6 w-6 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
