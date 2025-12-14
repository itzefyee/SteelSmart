/**
 * Cache Invalidation Examples
 * 
 * This file demonstrates how to use cache invalidation and manual refetch
 * functionality with React Query hooks in the SteelSmart application.
 * 
 * These examples satisfy requirement 10.4: Manual cache invalidation via refetch function
 */

'use client';

import React from 'react';
import { useCADHistory } from '@/hooks/useCADGeneration';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

/**
 * Example 1: Manual Refetch with CAD History
 * 
 * Demonstrates how to use the refetch function to manually refresh CAD history.
 * Useful for "Refresh" buttons or pull-to-refresh functionality.
 */
export function CADHistoryRefreshExample() {
  const { data, isLoading, error, refetch, isRefetching } = useCADHistory(10, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">CAD History</h2>
        
        {/* Manual Refetch Button */}
        <Button
          onClick={() => refetch()}
          disabled={isRefetching}
          variant="outline"
          size="sm"
        >
          {isRefetching ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Refreshing...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </>
          )}
        </Button>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <div className="text-red-600">Error: {error.message}</div>}
      {data && (
        <div className="space-y-2">
          {data.data.map((item) => (
            <div key={item.id} className="p-4 border rounded">
              {item.prompt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example 2: Manual Refetch with Products
 * 
 * Demonstrates how to use the refetch function with product queries.
 * Shows how to handle refetching state in the UI.
 */
export function ProductListRefreshExample() {
  const { 
    data, 
    isLoading, 
    error, 
    refetch, 
    isRefetching 
  } = useProducts({ 
    filters: { category: 'steel' },
    page: 1,
    limit: 20
  });

  const handleRefresh = async () => {
    try {
      await refetch();
      console.log('Products refreshed successfully');
    } catch (err) {
      console.error('Failed to refresh products:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Steel Products</h2>
        
        {/* Manual Refetch with Custom Handler */}
        <Button
          onClick={handleRefresh}
          disabled={isRefetching}
          variant="outline"
          size="sm"
        >
          {isRefetching ? 'Refreshing...' : 'Refresh Products'}
        </Button>
      </div>

      {/* Show loading overlay during refetch */}
      <div className="relative">
        {isRefetching && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <LoadingSpinner />
          </div>
        )}
        
        {isLoading && <LoadingSpinner />}
        {error && <div className="text-red-600">Error: {error.message}</div>}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.products.map((product) => (
              <div key={product.id} className="p-4 border rounded">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-gray-600">${product.price}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example 3: Automatic Refetch on Interval
 * 
 * Demonstrates how to combine manual refetch with automatic polling.
 * Useful for real-time data that needs periodic updates.
 */
export function AutoRefreshExample() {
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const { data, refetch, isRefetching } = useCADHistory(10, 0);

  // Auto-refresh every 30 seconds when enabled
  React.useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">CAD History (Auto-Refresh)</h2>
        
        <div className="flex items-center space-x-4">
          {/* Toggle Auto-Refresh */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Auto-refresh (30s)</span>
          </label>

          {/* Manual Refetch */}
          <Button
            onClick={() => refetch()}
            disabled={isRefetching}
            variant="outline"
            size="sm"
          >
            {isRefetching ? 'Refreshing...' : 'Refresh Now'}
          </Button>
        </div>
      </div>

      {/* Show last refresh time */}
      {data && (
        <div className="text-xs text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      )}

      {/* Content */}
      <div className="space-y-2">
        {data?.data.map((item) => (
          <div key={item.id} className="p-4 border rounded">
            {item.prompt}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 4: Refetch After Action
 * 
 * Demonstrates how to refetch after performing an action that doesn't
 * use React Query mutations (e.g., direct API calls).
 */
export function RefetchAfterActionExample() {
  const { data, refetch } = useCADHistory(10, 0);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDeleteItem = async (itemId: string) => {
    setIsDeleting(true);
    try {
      // Direct API call (not using React Query mutation)
      const response = await fetch(`/api/cad-history?id=${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      // Manually refetch to update the list
      await refetch();
      
      console.log('Item deleted and list refreshed');
    } catch (error) {
      console.error('Failed to delete item:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">CAD History (with Delete)</h2>
      
      <div className="space-y-2">
        {data?.data.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4 border rounded">
            <span>{item.prompt}</span>
            <Button
              onClick={() => handleDeleteItem(item.id)}
              disabled={isDeleting}
              variant="outline"
              size="sm"
              className="text-red-600"
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 5: Conditional Refetch
 * 
 * Demonstrates how to conditionally refetch based on user actions or state.
 */
export function ConditionalRefetchExample() {
  const [showStale, setShowStale] = React.useState(false);
  const { data, refetch } = useCADHistory(10, 0);

  // For this example, we'll consider data stale if it exists
  const isStale = !!data;

  // Auto-refetch when showing stale data
  React.useEffect(() => {
    if (showStale && isStale) {
      refetch();
    }
  }, [showStale, isStale, refetch]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">CAD History (Conditional Refetch)</h2>
        
        <Button
          onClick={() => setShowStale(true)}
          variant="outline"
          size="sm"
        >
          Show Latest
        </Button>
      </div>

      {/* Stale data warning */}
      {isStale && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
          <p className="text-yellow-800">
            Data is older than 5 minutes. Click "Show Latest" to refresh.
          </p>
        </div>
      )}

      {/* Content */}
      <div className="space-y-2">
        {data?.data.map((item) => (
          <div key={item.id} className="p-4 border rounded">
            {item.prompt}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Usage in Components
 * 
 * Import and use these examples in your components:
 * 
 * ```tsx
 * import { CADHistoryRefreshExample } from '@/components/examples/CacheInvalidationExample';
 * 
 * export default function MyPage() {
 *   return <CADHistoryRefreshExample />;
 * }
 * ```
 * 
 * Or extract the pattern and apply it to your own components:
 * 
 * ```tsx
 * const { data, refetch, isRefetching } = useCADHistory();
 * 
 * return (
 *   <button onClick={() => refetch()} disabled={isRefetching}>
 *     Refresh
 *   </button>
 * );
 * ```
 */
