# Implementation Plan

- [x] 1. Set up project dependencies and configuration





  - Install @tanstack/react-query, @tanstack/react-query-devtools, zustand, and @upstash/redis packages
  - Add Upstash Redis environment variables to .env.local template documentation
  - _Requirements: 1.1, 6.1_




- [ ] 2. Create React Query provider infrastructure

  - Create src/app/providers.tsx with QueryClientProvider and QueryClient configuration
  - Configure default query options (staleTime: 60s, refetchOnWindowFocus: false, retry: 1)


  - Add ReactQueryDevtools component for development mode
  - Update src/app/layout.tsx to wrap children with Providers component
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 3. Implement Redis cache utility layer

  - Create src/lib/cache/redis-cache.ts with Redis client initialization
  - Implement getCached function with key, fetcher, and TTL parameters




  - Implement setCached function for manual cache writes
  - Implement deleteCached function for cache invalidation
  - Implement invalidateCachePattern function for bulk invalidation
  - Add error handling with console logging and graceful fallback
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 11.1, 11.2, 11.3, 11.4, 11.5_





- [ ] 4. Create product service layer

  - Create src/services/product.service.ts with ProductService class
  - Implement getProducts static method with filters, page, and limit parameters
  - Implement getProduct static method for single product fetching




  - Build URLSearchParams from filters object
  - Add proper error handling with descriptive error messages
  - _Requirements: 2.1, 2.5_

- [ ] 5. Convert useProducts hook to React Query





  - Update src/hooks/useProducts.ts to use React Query's useQuery
  - Implement useProducts hook with filters, page, limit, and enabled options
  - Generate cache keys including filter parameters: ['products', filters, page, limit]
  - Set staleTime to 5 minutes (300000ms)
  - Implement useProduct hook for single product with cache key ['product', id]




  - Return data, isLoading, error, and refetch from both hooks
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 6. Add Redis caching to products API route





  - Update src/app/api/products/route.ts GET handler
  - Generate cache key from query parameters: `products:${filters}`
  - Check Redis cache before database query using getCached
  - Set TTL to 300 seconds (5 minutes)
  - Add console logging for cache hits and misses
  - Ensure graceful fallback to database on cache errors
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 12.1_





- [ ] 7. Update product catalog components

  - Update src/app/catalog/page.tsx to use new useProducts hook
  - Replace manual loading state with isLoading from React Query
  - Replace manual error handling with error from React Query


  - Use refetch function for manual refresh
  - Remove old useState and useEffect code
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 8. Create CAD service layer

  - Create src/services/cad.service.ts with CADService class
  - Implement generateCAD static method with CADGenerationRequest parameter
  - Implement getHistory static method for fetching CAD history
  - Add proper error handling with descriptive messages
  - _Requirements: 3.1_

- [ ] 9. Create CAD Zustand store

  - Create src/stores/cad.store.ts with CADStore interface
  - Implement state: selectedFormat, selectedUnits, selectedCategory, recentPrompts
  - Implement actions: setFormat, setUnits, setCategory, addRecentPrompt, clearRecentPrompts
  - Add persist middleware with localStorage key 'cad-store'
  - Configure partialize to persist only selectedFormat, selectedUnits, and recentPrompts
  - Add devtools middleware with name 'CADStore'
  - Implement addRecentPrompt to deduplicate and limit to 10 items
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 9.1, 9.2, 9.3, 9.4, 9.5_


- [ ] 10. Convert useCADGeneration hook to React Query
  - Update src/hooks/useCADGeneration.ts to use React Query's useMutation
  - Implement useCADGeneration hook with onSuccess and onError options
  - Call CADService.generateCAD in mutationFn
  - Add recent prompt to Zustand store in onSuccess callback
  - Invalidate ['cad-history'] query cache on success using queryClient
  - Implement useCADHistory hook using useQuery with 2-minute staleTime
  - Return mutate, isPending, data, and error from mutation hook
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 10.1, 10.3_

- [x] 11. Update CAD generator components



  - Update src/app/cad-generator/page.tsx to use new hooks
  - Use useCADStore for format, units, and recent prompts state
  - Use useCADGeneration mutation for generation requests
  - Replace manual loading state with isPending from mutation
  - Add UI for displaying recent prompts from Zustand store
  - Remove old useState and useEffect code
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
-

- [x] 12. Implement cache invalidation for mutations




  - Add queryClient.invalidateQueries call in CAD generation onSuccess
  - Use query key ['cad-history'] for invalidation
  - Add manual refetch support via refetch function in components
  - Document cache invalidation strategy in code comments
  - _Requirements: 10.1, 10.2, 10.3, 10.4_
-

- [x] 13. Add Redis caching for CAD analysis API




  - Update src/app/api/analyze-drawing/route.ts POST handler
  - Generate cache key from drawing hash or content hash
  - Set TTL to 86400 seconds (24 hours) for analysis results
  - Add console logging for cache operations
  - _Requirements: 12.3_

- [x] 14. Add Redis caching for recommendations API




  - Update src/app/api/recommendations/route.ts GET handler
  - Generate cache key from product ID and filters
  - Set TTL to 3600 seconds (1 hour) for recommendations
  - Add console logging for cache operations
  - _Requirements: 12.4_
-

- [x] 15. Implement cache key generation utilities




  - Create src/lib/cache/cache-keys.ts with helper functions
  - Implement generateProductCacheKey function
  - Implement generateCADCacheKey function
  - Implement generateRecommendationCacheKey function
  - Add hash function for complex filter objects
  - _Requirements: 7.2, 12.5_
-

- [x] 16. Add Redis cache clearing on data updates




  - Implement deleteCached calls when products are updated
  - Implement invalidateCachePattern for related cache keys
  - Add cache invalidation to product update API routes
  - Document which mutations trigger cache invalidation
  - _Requirements: 10.2, 10.5_

- [x] 17. Create test page for setup verification





  - Create src/app/test-setup/page.tsx for testing React Query
  - Add simple useQuery test with mock data
  - Add Zustand store test with state updates
  - Display React Query DevTools status
  - Add instructions for verifying Redis connection
  - _Requirements: 1.3_

- [x] 18. Add error boundaries for React Query errors





  - Create src/components/ErrorBoundary.tsx component
  - Wrap QueryClientProvider with error boundary
  - Display user-friendly error messages
  - Add retry button for failed queries
  - _Requirements: 11.1, 11.4, 11.5_




- [ ] 19. Implement performance monitoring

  - Add cache hit/miss logging to Redis utilities
  - Add query timing logs to React Query hooks
  - Create performance metrics dashboard component




  - Document expected performance improvements
  - _Requirements: 7.4, 7.5_

- [ ] 20. Write documentation for new architecture

  - Update README with React Query usage examples
  - Document Zustand store patterns
  - Document Redis caching strategy and TTLs
  - Add troubleshooting guide for common issues
  - Create migration guide for remaining hooks
  - _Requirements: 12.5_
