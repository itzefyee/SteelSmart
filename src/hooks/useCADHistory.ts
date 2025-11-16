import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import type { CADHistory } from '@/lib/supabase';

interface UseCADHistoryOptions {
  userId: string;
  pageSize?: number;
  statusFilter?: string | null;
  formatFilter?: string | null;
}

interface UseCADHistoryReturn {
  history: CADHistory[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  setStatusFilter: (status: string | null) => void;
  setFormatFilter: (format: string | null) => void;
  refresh: () => void;
}

export function useCADHistory({
  userId,
  pageSize = 10,
  statusFilter = null,
  formatFilter = null,
}: UseCADHistoryOptions): UseCADHistoryReturn {
  const [history, setHistory] = useState<CADHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilterState, setStatusFilterState] = useState<string | null>(statusFilter);
  const [formatFilterState, setFormatFilterState] = useState<string | null>(formatFilter);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      
      // Build query
      let query = supabase
        .from('cad_history')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('generated_at', { ascending: false });

      // Apply filters
      if (statusFilterState) {
        query = query.eq('status', statusFilterState);
      }

      if (formatFilterState) {
        query = query.eq('format', formatFilterState);
      }

      // Apply pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setHistory(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching CAD history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch CAD history');
      setHistory([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [userId, currentPage, pageSize, statusFilterState, formatFilterState]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [hasPreviousPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const setStatusFilter = useCallback((status: string | null) => {
    setStatusFilterState(status);
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  const setFormatFilter = useCallback((format: string | null) => {
    setFormatFilterState(format);
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  const refresh = useCallback(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    goToPage,
    setStatusFilter,
    setFormatFilter,
    refresh,
  };
}
