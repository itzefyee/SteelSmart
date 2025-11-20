/**
 * Performance Monitoring Page
 * 
 * This page demonstrates the performance monitoring system and provides
 * a dedicated view for tracking cache and query performance metrics.
 * 
 * Features:
 * - Real-time performance metrics
 * - Cache hit/miss statistics
 * - Query performance tracking
 * - Performance optimization tips
 * 
 * Requirements: 7.4, 7.5
 */

import PerformanceMetricsDashboard from '@/components/performance/PerformanceMetricsDashboard';

export default function PerformancePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Performance Monitoring
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Monitor application performance, cache effectiveness, and query optimization opportunities.
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            About Performance Monitoring
          </h2>
          
          <div className="space-y-4 text-gray-600 dark:text-gray-400">
            <p>
              The Metalyze application uses a sophisticated caching and state management
              architecture to deliver fast, responsive user experiences. This page provides
              insights into how well the system is performing.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Redis Cache
                </h3>
                <p className="text-sm">
                  Server-side caching reduces database load and improves API response times.
                  Cache metrics are logged server-side and can be viewed in the server console.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  React Query
                </h3>
                <p className="text-sm">
                  Client-side query caching eliminates redundant API calls and provides
                  instant data access for frequently accessed resources.
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                Performance Targets
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <li>• Cache hit rate: &gt;80%</li>
                <li>• Cache hit response time: &lt;50ms</li>
                <li>• Cache miss response time: &lt;200ms</li>
                <li>• Database query reduction: 80-90%</li>
              </ul>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                Optimization Tips
              </h3>
              <ul className="text-sm text-yellow-800 dark:text-yellow-400 space-y-1">
                <li>• Low cache hit rate? Consider increasing TTL values</li>
                <li>• Slow queries? Check database indexes and query optimization</li>
                <li>• High error rate? Review Redis connection and error logs</li>
                <li>• Check browser console for detailed query performance logs</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            How to Use
          </h2>
          
          <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm">
            <div className="flex items-start">
              <span className="font-semibold mr-2">1.</span>
              <p>
                Click the "📊 Performance" button in the bottom-right corner to open the metrics dashboard
              </p>
            </div>
            <div className="flex items-start">
              <span className="font-semibold mr-2">2.</span>
              <p>
                The dashboard auto-refreshes every 5 seconds to show real-time metrics
              </p>
            </div>
            <div className="flex items-start">
              <span className="font-semibold mr-2">3.</span>
              <p>
                Navigate to different pages (catalog, CAD generator) to generate query activity
              </p>
            </div>
            <div className="flex items-start">
              <span className="font-semibold mr-2">4.</span>
              <p>
                Check browser console for detailed performance logs with timing information
              </p>
            </div>
            <div className="flex items-start">
              <span className="font-semibold mr-2">5.</span>
              <p>
                For server-side cache metrics, check the server console logs
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            For detailed documentation, see{' '}
            <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
              documentation/PERFORMANCE_MONITORING.md
            </code>
          </p>
        </div>
      </div>

      {/* Performance Dashboard - Always visible on this page */}
      <PerformanceMetricsDashboard />
    </div>
  );
}
