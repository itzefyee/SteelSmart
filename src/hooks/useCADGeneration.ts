import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CADAPI, CADHistoryResponse } from '@/lib/api/cad-api';
import { CADGenerationRequest, CADGenerationResult } from '@/services/cad-generation.service';
import { useCADStore } from '@/stores/cad.store';
import { logQueryPerformance } from '@/lib/performance/query-performance';

/**
 * CAD Generation Hooks with Cache Invalidation
 * 
 * This module provides React Query hooks for CAD generation and history management
 * with automatic cache invalidation to ensure data consistency across the application.
 * 
 * ============================================================================
 * CACHE INVALIDATION STRATEGY
 * ============================================================================
 * 
 * Overview:
 * When a user generates a new CAD model, we need to ensure that the CAD history
 * list is updated to show the new model. This is achieved through React Query's
 * cache invalidation mechanism.
 * 
 * Automatic Invalidation:
 * 1. User submits CAD generation request via useCADGeneration mutation
 * 2. On successful generation, the mutation automatically invalidates ['cad-history'] cache
 * 3. React Query marks all queries with 'cad-history' key as stale
 * 4. Components using useCADHistory automatically refetch in the background
 * 5. UI updates with the new CAD model in the history list
 * 
 * Manual Invalidation:
 * Components can also manually trigger a refetch using the refetch function:
 * 
 * Example:
 * ```tsx
 * const { data, refetch, isRefetching } = useCADHistory();
 * 
 * return (
 *   <button onClick={() => refetch()} disabled={isRefetching}>
 *     {isRefetching ? 'Refreshing...' : 'Refresh History'}
 *   </button>
 * );
 * ```
 * 
 * Cache Keys:
 * - ['cad-history'] - Base key for all CAD history queries
 * - ['cad-history', limit, offset] - Paginated history queries
 * 
 * When to Invalidate:
 * - After successful CAD generation (automatic)
 * - After deleting a history item (manual via refetch)
 * - When user explicitly requests refresh (manual via refetch)
 * - After clearing all history (manual via refetch)
 * 
 * Benefits:
 * - No manual state management needed
 * - Automatic background updates
 * - Consistent data across all components
 * - Optimized network requests (deduplication, caching)
 * - Better UX with loading and error states
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4
 * ============================================================================
 */

/**
 * Options for useCADGeneration hook
 */
export interface UseCADGenerationOptions {
  onSuccess?: (result: CADGenerationResult) => void;
  onError?: (error: Error) => void;
}

/**
 * useCADGeneration Hook
 * 
 * React Query mutation hook for CAD generation with automatic cache invalidation.
 * 
 * Cache Invalidation Strategy:
 * - On successful CAD generation, automatically invalidates the ['cad-history'] query cache
 * - This ensures the CAD history list is refetched and displays the newly generated model
 * - Uses React Query's invalidateQueries to mark the cache as stale and trigger a background refetch
 * - The invalidation is scoped to all queries with the 'cad-history' key, including paginated variants
 * 
 * Workflow:
 * 1. User submits CAD generation request
 * 2. Mutation calls CADAPI.generateCAD
 * 3. On success:
 *    a. Add prompt to Zustand store for recent prompts feature
 *    b. Invalidate ['cad-history'] cache to trigger refetch
 *    c. Call user-provided onSuccess callback
 * 4. Components using useCADHistory will automatically receive updated data
 * 
 * Requirements: 3.2, 3.3, 3.4, 3.5, 10.1, 10.2, 10.3, 10.4
 */
export const useCADGeneration = (options: UseCADGenerationOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();
  const addRecentPrompt = useCADStore((state) => state.addRecentPrompt);

  const mutation = useMutation<CADGenerationResult, Error, CADGenerationRequest>({
    mutationFn: (request: CADGenerationRequest) => CADAPI.generateCAD(request),
    
    onSuccess: (data, variables) => {
      // Add the prompt to recent prompts in Zustand store
      addRecentPrompt(variables.description);
      
      /**
       * Cache Invalidation: Invalidate CAD history queries
       * 
       * This invalidates all queries with the 'cad-history' key prefix, including:
       * - ['cad-history'] - base query
       * - ['cad-history', limit, offset] - paginated queries
       * 
       * React Query will mark these queries as stale and automatically refetch them
       * in the background if they are currently being used by any component.
       * 
       * This ensures users see their newly generated CAD model in the history list
       * without needing to manually refresh the page.
       */
      queryClient.invalidateQueries({ queryKey: ['cad-history'] });
      
      // Call user-provided onSuccess callback
      onSuccess?.(data);
    },
    
    onError: (error) => {
      // Call user-provided onError callback
      onError?.(error);
    },
  });

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    data: mutation.data,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * useCADHistory Hook
 * 
 * React Query hook for fetching CAD generation history with manual refetch support.
 * 
 * Cache Behavior:
 * - Data is considered fresh for 2 minutes (staleTime: 120000ms)
 * - After 2 minutes, data becomes stale and will refetch on next access
 * - Automatically refetches when invalidated by useCADGeneration mutation
 * 
 * Manual Refetch:
 * - Components can call the returned `refetch` function to manually refresh the history
 * - Useful for "Refresh" buttons or pull-to-refresh functionality
 * - Example: const { data, refetch } = useCADHistory(); <button onClick={() => refetch()}>Refresh</button>
 * 
 * Pagination:
 * - Supports limit and offset parameters for paginated history
 * - Each pagination state has its own cache entry
 * - Cache key: ['cad-history', limit, offset]
 * 
 * Requirements: 3.2, 3.3, 3.4, 3.5, 10.1, 10.3, 10.4
 */
export const useCADHistory = (limit: number = 10, offset: number = 0) => {
  const queryKey = ['cad-history', limit, offset];

  const query = useQuery<CADHistoryResponse, Error>({
    queryKey,
    // Add performance monitoring to query function
    queryFn: async () => {
      const startTime = performance.now();
      try {
        const result = await CADAPI.getHistory(limit, offset);
        const duration = performance.now() - startTime;
        logQueryPerformance(queryKey, duration, 'success', 'miss');
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        logQueryPerformance(queryKey, duration, 'error', 'miss');
        throw error;
      }
    },
    // Data is considered fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    /**
     * Manual refetch function for cache invalidation
     * 
     * Call this function to manually refresh the CAD history data.
     * This bypasses the staleTime and forces a fresh fetch from the API.
     * 
     * Use cases:
     * - User clicks a "Refresh" button
     * - Pull-to-refresh gesture
     * - After deleting a history item
     * - When user wants to ensure they have the latest data
     */
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
};
