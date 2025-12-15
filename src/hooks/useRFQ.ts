/**
 * RFQ React Query Hooks
 * 
 * Provides React Query hooks for RFQ operations with automatic caching,
 * optimistic updates, and error handling.
 * 
 * Cache Strategy:
 * - RFQ list: 2 minutes stale time
 * - Single RFQ: 5 minutes stale time
 * - Automatic invalidation after mutations
 * - Optimistic updates for delete operations
 * 
 * Usage:
 * ```tsx
 * const { data: rfqs, isLoading, error, refetch } = useRFQList();
 * const { mutate: submitRFQ, isPending } = useRFQSubmit();
 * ```
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { RFQAPI, type RFQ, type RFQFormData } from '@/lib/api/rfq-api';

/**
 * Fetch list of RFQs for current user
 * 
 * Automatically caches results for 2 minutes.
 * Use refetch() to manually refresh the list.
 * 
 * @returns Query result with RFQ array, loading state, and error
 * 
 * @example
 * ```tsx
 * function RFQList() {
 *   const { data: rfqs = [], isLoading, error, refetch } = useRFQList();
 *   
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   
 *   return (
 *     <>
 *       <button onClick={() => refetch()}>Refresh</button>
 *       {rfqs.map(rfq => <RFQCard key={rfq.id} rfq={rfq} />)}
 *     </>
 *   );
 * }
 * ```
 */
export function useRFQList(): UseQueryResult<RFQ[], Error> {
  return useQuery({
    queryKey: ['rfqs'],
    queryFn: () => RFQAPI.getList(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch single RFQ by ID
 * 
 * Automatically caches results for 5 minutes.
 * Only fetches if ID is provided (enabled: !!id).
 * 
 * @param id - RFQ ID to fetch
 * @returns Query result with RFQ object, loading state, and error
 * 
 * @example
 * ```tsx
 * function RFQDetail({ id }: { id: string }) {
 *   const { data: rfq, isLoading, error } = useRFQ(id);
 *   
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   if (!rfq) return <div>RFQ not found</div>;
 *   
 *   return <RFQDetails rfq={rfq} />;
 * }
 * ```
 */
export function useRFQ(id: string): UseQueryResult<RFQ, Error> {
  return useQuery({
    queryKey: ['rfq', id],
    queryFn: () => RFQAPI.getById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  });
}

/**
 * Submit new RFQ
 * 
 * Automatically invalidates RFQ list cache on success.
 * Optimistically adds new RFQ to cache.
 * 
 * @returns Mutation result with mutate function, loading state, and error
 * 
 * @example
 * ```tsx
 * function RFQForm() {
 *   const { mutate: submitRFQ, isPending, error } = useRFQSubmit({
 *     onSuccess: () => {
 *       toast.success('RFQ submitted successfully!');
 *       router.push('/account?tab=rfqs');
 *     },
 *     onError: (error) => {
 *       toast.error(`Failed to submit: ${error.message}`);
 *     },
 *   });
 *   
 *   const handleSubmit = (data: RFQFormData) => {
 *     submitRFQ(data);
 *   };
 *   
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {/* form fields *\/}
 *       <button disabled={isPending}>
 *         {isPending ? 'Submitting...' : 'Submit RFQ'}
 *       </button>
 *       {error && <ErrorMessage error={error} />}
 *     </form>
 *   );
 * }
 * ```
 */
export function useRFQSubmit(options?: {
  onSuccess?: (rfq: RFQ) => void;
  onError?: (error: Error) => void;
}): UseMutationResult<RFQ, Error, RFQFormData> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RFQFormData) => RFQAPI.submit(data),
    onSuccess: (newRFQ) => {
      // Invalidate RFQ list to refetch
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      
      // Optimistically add to cache
      queryClient.setQueryData(['rfq', newRFQ.id], newRFQ);
      
      // Call custom success handler
      options?.onSuccess?.(newRFQ);
    },
    onError: (error) => {
      // Call custom error handler
      options?.onError?.(error);
    },
  });
}

/**
 * Update existing RFQ
 * 
 * Automatically invalidates both single RFQ and list caches on success.
 * Updates single RFQ cache optimistically.
 * 
 * @returns Mutation result with mutate function, loading state, and error
 * 
 * @example
 * ```tsx
 * function RFQStatusUpdate({ rfqId }: { rfqId: string }) {
 *   const { mutate: updateRFQ, isPending } = useRFQUpdate({
 *     onSuccess: () => {
 *       toast.success('RFQ updated successfully!');
 *     },
 *   });
 *   
 *   const handleStatusChange = (status: string) => {
 *     updateRFQ({ id: rfqId, updates: { status } });
 *   };
 *   
 *   return (
 *     <select onChange={(e) => handleStatusChange(e.target.value)} disabled={isPending}>
 *       <option value="Submitted">Submitted</option>
 *       <option value="In Review">In Review</option>
 *       <option value="Approved">Approved</option>
 *     </select>
 *   );
 * }
 * ```
 */
export function useRFQUpdate(options?: {
  onSuccess?: (rfq: RFQ) => void;
  onError?: (error: Error) => void;
}): UseMutationResult<RFQ, Error, { id: string; updates: Partial<RFQ> }> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }) => RFQAPI.update(id, updates),
    onSuccess: (updatedRFQ, { id }) => {
      // Update single RFQ cache
      queryClient.setQueryData(['rfq', id], updatedRFQ);
      
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      
      // Call custom success handler
      options?.onSuccess?.(updatedRFQ);
    },
    onError: (error) => {
      // Call custom error handler
      options?.onError?.(error);
    },
  });
}

/**
 * Delete RFQ with optimistic update
 * 
 * Optimistically removes RFQ from list immediately for instant feedback.
 * Rolls back on error.
 * Always refetches list after success or error.
 * 
 * @returns Mutation result with mutate function, loading state, and error
 * 
 * @example
 * ```tsx
 * function RFQDeleteButton({ rfqId }: { rfqId: string }) {
 *   const { mutate: deleteRFQ, isPending } = useRFQDelete({
 *     onSuccess: () => {
 *       toast.success('RFQ deleted successfully!');
 *     },
 *     onError: (error) => {
 *       toast.error(`Failed to delete: ${error.message}`);
 *     },
 *   });
 *   
 *   const handleDelete = () => {
 *     if (confirm('Are you sure you want to delete this RFQ?')) {
 *       deleteRFQ(rfqId);
 *     }
 *   };
 *   
 *   return (
 *     <button onClick={handleDelete} disabled={isPending}>
 *       {isPending ? 'Deleting...' : 'Delete'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useRFQDelete(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => RFQAPI.delete(id),
    
    // Optimistic update
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['rfqs'] });
      
      // Snapshot previous value
      const previousRFQs = queryClient.getQueryData<RFQ[]>(['rfqs']);
      
      // Optimistically remove from list
      queryClient.setQueryData<RFQ[]>(['rfqs'], (old) =>
        old?.filter((rfq) => rfq.id !== id) || []
      );
      
      return { previousRFQs };
    },
    
    // Rollback on error
    onError: (error, id, context) => {
      if (context?.previousRFQs) {
        queryClient.setQueryData(['rfqs'], context.previousRFQs);
      }
      
      // Call custom error handler
      options?.onError?.(error);
    },
    
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      
      // Call custom success handler
      options?.onSuccess?.();
    },
  });
}
