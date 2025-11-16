'use client';

import { useState } from 'react';
import { useCADHistory } from '@/hooks/useCADHistory';
import CADHistoryDetailModal from './CADHistoryDetailModal';
import type { CADHistory } from '@/lib/supabase';

interface CADHistorySectionProps {
  userId: string;
}

export default function CADHistorySection({ userId }: CADHistorySectionProps) {
  const [selectedItem, setSelectedItem] = useState<CADHistory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  const {
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
    setStatusFilter,
    setFormatFilter,
    refresh,
  } = useCADHistory({ userId, pageSize: 10 });

  const handleDelete = async (itemId: string) => {
    setDeleteError(null);

    try {
      const response = await fetch(`/api/cad/history/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete item');
      }

      // Refresh the history list
      refresh();
    } catch (err) {
      console.error('Error deleting CAD history item:', err);
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete item');
      throw err; // Re-throw to let modal handle it
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string | null) => {
    const statusLower = (status || 'unknown').toLowerCase();
    
    const styles = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      processing: 'bg-yellow-100 text-yellow-800',
      unknown: 'bg-gray-100 text-gray-800',
    };

    const style = styles[statusLower as keyof typeof styles] || styles.unknown;

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${style}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">CAD Generation History</h2>
          <p className="text-sm text-gray-600 mt-1">
            {totalCount} {totalCount === 1 ? 'generation' : 'generations'} total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status-filter"
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="processing">Processing</option>
          </select>
        </div>

        <div>
          <label htmlFor="format-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Format
          </label>
          <select
            id="format-filter"
            onChange={(e) => setFormatFilter(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Formats</option>
            <option value="step">STEP</option>
            <option value="stl">STL</option>
            <option value="obj">OBJ</option>
            <option value="gltf">GLTF</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading history...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Delete Error */}
      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {deleteError}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && history.length === 0 && (
        <div className="text-center py-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <p className="mt-2 text-gray-600">No CAD generations found</p>
          <p className="text-sm text-gray-500">Start generating CAD models to see them here</p>
        </div>
      )}

      {/* History List */}
      {!loading && !error && history.length > 0 && (
        <>
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => {
                  setSelectedItem(item);
                  setIsModalOpen(true);
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">
                      {item.prompt.length > 100
                        ? `${item.prompt.substring(0, 100)}...`
                        : item.prompt}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <span>Format: <span className="font-medium">{item.format.toUpperCase()}</span></span>
                      {item.category && (
                        <span>Category: <span className="font-medium">{item.category}</span></span>
                      )}
                      {item.units && (
                        <span>Units: <span className="font-medium">{item.units}</span></span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    {getStatusBadge(item.status)}
                    <span className="text-xs text-gray-500">
                      {formatDate(item.generated_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={previousPage}
                  disabled={!hasPreviousPage}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={nextPage}
                  disabled={!hasNextPage}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <CADHistoryDetailModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
          setDeleteError(null);
        }}
        onDelete={handleDelete}
      />
    </div>
  );
}
