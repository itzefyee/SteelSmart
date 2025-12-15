'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCADStore } from '@/stores/cad.store';
import { useState } from 'react';

/**
 * Test Setup Page
 * 
 * This page verifies that React Query, Zustand, and Redis are properly configured.
 * Use this page during development to ensure all state management infrastructure is working.
 */
export default function TestSetupPage() {
  const queryClient = useQueryClient();
  const [testResult, setTestResult] = useState<string>('');
  const [redisTestResult, setRedisTestResult] = useState<string>('');

  // Test React Query with a simple query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['test-query'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        message: 'React Query is working!',
        timestamp: new Date().toISOString(),
      };
    },
    staleTime: 10000, // 10 seconds
  });

  // Test Zustand store
  const {
    selectedFormat,
    setSelectedFormat,
    exportSettings,
    updateExportSettings,
    recentGenerations,
    addRecentGeneration,
    clearRecentGenerations,
  } = useCADStore();

  // Test Redis connection
  const testRedisConnection = async () => {
    setRedisTestResult('Testing Redis connection...');
    try {
      const response = await fetch('/api/test-redis');
      const result = await response.json();
      
      if (response.ok) {
        setRedisTestResult(`✅ Redis is working! ${result.message}`);
      } else {
        setRedisTestResult(`❌ Redis test failed: ${result.error}`);
      }
    } catch (error) {
      setRedisTestResult(`❌ Redis test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            State Management Test Page
          </h1>
          <p className="text-slate-400">
            Verify React Query, Zustand, and Redis setup
          </p>
        </div>

        {/* React Query Test */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-blue-400">⚡</span>
            React Query Test
          </h2>
          
          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded p-4">
              <p className="text-sm text-slate-400 mb-2">Query Status:</p>
              {isLoading && (
                <p className="text-yellow-400">⏳ Loading...</p>
              )}
              {error && (
                <p className="text-red-400">❌ Error: {error.message}</p>
              )}
              {data && (
                <div className="text-green-400">
                  <p>✅ {data.message}</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Timestamp: {data.timestamp}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Refetch Query
            </button>

            <div className="bg-slate-900/50 rounded p-4">
              <p className="text-sm text-slate-400 mb-2">Query Cache Info:</p>
              <p className="text-white text-sm">
                Total queries in cache: {queryClient.getQueryCache().getAll().length}
              </p>
            </div>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded p-4">
              <p className="text-sm text-blue-300">
                💡 <strong>React Query DevTools:</strong> Look for the floating React Query icon
                in the bottom corner of your screen. Click it to inspect queries, cache, and mutations.
              </p>
            </div>
          </div>
        </div>

        {/* Zustand Store Test */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-purple-400">🗄️</span>
            Zustand Store Test
          </h2>

          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded p-4">
              <p className="text-sm text-slate-400 mb-2">Current State:</p>
              <div className="space-y-1 text-sm">
                <p className="text-white">
                  <span className="text-slate-400">Format:</span> {selectedFormat}
                </p>
                <p className="text-white">
                  <span className="text-slate-400">Units:</span> {exportSettings.unit}
                </p>
                <p className="text-white">
                  <span className="text-slate-400">Recent Generations:</span> {recentGenerations.length} items
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Test Format Selection:
                </label>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 text-white rounded border border-slate-700 focus:border-purple-500 focus:outline-none"
                >
                  <option value="step">STEP</option>
                  <option value="stl">STL</option>
                  <option value="obj">OBJ</option>
                  <option value="gltf">GLTF</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Test Units Selection:
                </label>
                <select
                  value={exportSettings.unit}
                  onChange={(e) => updateExportSettings({ unit: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-900 text-white rounded border border-slate-700 focus:border-purple-500 focus:outline-none"
                >
                  <option value="mm">Millimeters</option>
                  <option value="cm">Centimeters</option>
                  <option value="in">Inches</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Test Recent Generations:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter a test prompt..."
                  className="flex-1 px-3 py-2 bg-slate-900 text-white rounded border border-slate-700 focus:border-purple-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      addRecentGeneration({
                        id: Date.now().toString(),
                        prompt: e.currentTarget.value,
                        timestamp: Date.now(),
                        status: 'completed',
                        formats: [selectedFormat]
                      });
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <button
                  onClick={clearRecentGenerations}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Clear
                </button>
              </div>
              {recentGenerations.length > 0 && (
                <div className="mt-2 space-y-1">
                  {recentGenerations.map((gen, index) => (
                    <div
                      key={gen.id}
                      className="text-sm text-slate-300 bg-slate-900/50 px-3 py-1 rounded"
                    >
                      {index + 1}. {gen.prompt}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-purple-900/20 border border-purple-700/50 rounded p-4">
              <p className="text-sm text-purple-300">
                💡 <strong>Persistence Test:</strong> Change the format or units, add some prompts,
                then refresh the page. Your selections should persist via localStorage.
              </p>
            </div>
          </div>
        </div>

        {/* Redis Test */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-red-400">🔴</span>
            Redis Connection Test
          </h2>

          <div className="space-y-4">
            <button
              onClick={testRedisConnection}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              Test Redis Connection
            </button>

            {redisTestResult && (
              <div className="bg-slate-900/50 rounded p-4">
                <p className="text-white text-sm">{redisTestResult}</p>
              </div>
            )}

            <div className="bg-red-900/20 border border-red-700/50 rounded p-4 space-y-2">
              <p className="text-sm text-red-300">
                <strong>📋 Redis Setup Instructions:</strong>
              </p>
              <ol className="text-sm text-red-200 space-y-1 list-decimal list-inside">
                <li>Create a free account at <a href="https://upstash.com" target="_blank" rel="noopener noreferrer" className="underline">upstash.com</a></li>
                <li>Create a new Redis database</li>
                <li>Copy the REST URL and REST Token</li>
                <li>Add to your .env.local file:
                  <pre className="mt-2 bg-slate-900 p-2 rounded text-xs overflow-x-auto">
                    UPSTASH_REDIS_REST_URL=your_url_here{'\n'}
                    UPSTASH_REDIS_REST_TOKEN=your_token_here
                  </pre>
                </li>
                <li>Restart your development server</li>
                <li>Click "Test Redis Connection" above</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-semibold text-white mb-4">
            ✅ Setup Checklist
          </h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-white">React Query Provider configured</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-white">React Query DevTools available</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-white">Zustand store working with persistence</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={redisTestResult.includes('✅') ? 'text-green-400' : 'text-yellow-400'}>
                {redisTestResult.includes('✅') ? '✓' : '○'}
              </span>
              <span className="text-white">
                Redis connection {redisTestResult.includes('✅') ? 'verified' : 'pending verification'}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
