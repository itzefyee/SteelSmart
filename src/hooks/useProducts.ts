import { useQuery } from '@tanstack/react-query';
import { ProductAPI, type ProductFilters, type ProductResponse } from '@/lib/api/product-api';
import { logQueryPerformance } from '@/lib/performance/query-performance';

export type { ProductFilters } from '@/lib/api/product-api';

export interface UseProductsOptions {
  filters?: ProductFilters;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

/**
 * Product Hooks with Cache Management
 * 
 * ============================================================================
 * CACHE INVALIDATION STRATEGY FOR PRODUCTS
 * ============================================================================
 * 
 * Cache Behavior:
 * - Product lists are cached for 5 minutes (staleTime: 300000ms)
 * - Each unique combination of filters, page, and limit has its own cache entry
 * - After 5 minutes, data becomes stale and will refetch on next access
 * 
 * Manual Refetch:
 * All hooks return a `refetch` function for manual cache invalidation:
 * 
 * Example:
 * ```tsx
 * const { data, refetch, isRefetching } = useProducts({ filters: { category: 'steel' } });
 * 
 * return (
 *   <button onClick={() => refetch()} disabled={isRefetching}>
 *     {isRefetching ? 'Refreshing...' : 'Refresh Products'}
 *   </button>
 * );
 * ```
 * 
 * When to Invalidate:
 * - After product is updated (use queryClient.invalidateQueries({ queryKey: ['products'] }))
 * - After product is deleted (use queryClient.invalidateQueries({ queryKey: ['products'] }))
 * - When user explicitly requests refresh (use refetch function)
 * - After bulk operations on products
 * 
 * Cache Keys:
 * - ['products', filters, page, limit] - Product list queries
 * - ['product', id] - Single product queries
 * 
 * Future Enhancement:
 * When product mutations are implemented, they should invalidate the product cache:
 * 
 * ```tsx
 * const updateProduct = useMutation({
 *   mutationFn: ProductService.updateProduct,
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: ['products'] });
 *     queryClient.invalidateQueries({ queryKey: ['product', productId] });
 *   }
 * });
 * ```
 * 
 * Requirements: 10.2, 10.4
 * ============================================================================
 */

/**
 * React Query hook to fetch products with filters and pagination
 * Implements automatic caching with 5-minute stale time
 * 
 * @param options - Configuration options for the query
 * @returns Query result with data, isLoading, error, refetch, and isRefetching
 * 
 * The returned refetch function can be used for manual cache invalidation:
 * - Call refetch() to force a fresh fetch from the API
 * - Useful for "Refresh" buttons or pull-to-refresh functionality
 * - Bypasses the staleTime and always fetches fresh data
 */
export function useProducts(options: UseProductsOptions = {}) {
  const {
    filters = {},
    page = 1,
    limit = 20,
    enabled = true,
  } = options;

  const queryKey = ['products', filters, page, limit];

  return useQuery<ProductResponse, Error>({
    // Generate unique cache key including all parameters
    queryKey,
    // Use ProductAPI to fetch data with performance monitoring
    queryFn: async () => {
      const startTime = performance.now();
      try {
        const result = await ProductAPI.getProducts(filters, page, limit);
        const duration = performance.now() - startTime;
        logQueryPerformance(queryKey, duration, 'success', 'miss');
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        logQueryPerformance(queryKey, duration, 'error', 'miss');
        throw error;
      }
    },
    // Keep data fresh for 5 minutes (300000ms)
    staleTime: 5 * 60 * 1000,
    // Enable/disable query based on options
    enabled,
  });
}

/**
 * React Query hook to fetch a single product by ID
 * Implements automatic caching with default stale time
 * 
 * @param id - The product ID to fetch
 * @returns Query result with data, isLoading, error, refetch, and isRefetching
 * 
 * Manual Cache Invalidation:
 * The returned refetch function can be used to manually refresh a single product:
 * 
 * Example:
 * ```tsx
 * const { data: product, refetch } = useProduct(productId);
 * 
 * const handleProductUpdate = async () => {
 *   await updateProduct(productId, changes);
 *   refetch(); // Refresh the product data after update
 * };
 * ```
 * 
 * Note: When product mutations are implemented, they should automatically
 * invalidate the cache instead of requiring manual refetch calls.
 */
export function useProduct(id: string) {
  const queryKey = ['product', id];

  return useQuery({
    // Generate unique cache key for single product
    queryKey,
    // Use ProductAPI to fetch single product with performance monitoring
    queryFn: async () => {
      const startTime = performance.now();
      try {
        const result = await ProductAPI.getProduct(id);
        const duration = performance.now() - startTime;
        logQueryPerformance(queryKey, duration, 'success', 'miss');
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        logQueryPerformance(queryKey, duration, 'error', 'miss');
        throw error;
      }
    },
    // Only fetch if id is provided
    enabled: !!id,
  });
}
