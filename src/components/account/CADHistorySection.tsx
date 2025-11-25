'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCADHistory } from '@/hooks/useCADHistory';
import CADHistoryDetailModal from './CADHistoryDetailModal';
import type { CADHistory, DrawingAnalysis, RFQSubmission } from '@/lib/supabase';
import { getSupabaseClient } from '@/lib/supabase';

type HistoryTab = 'generations' | 'analyses' | 'rfqs';

interface CADHistorySectionProps {
  userId: string;
}

export default function CADHistorySection({ userId }: CADHistorySectionProps) {
  const [selectedItem, setSelectedItem] = useState<CADHistory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<HistoryTab>('generations');
  const [analysisHistory, setAnalysisHistory] = useState<DrawingAnalysis[]>([]);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [rfqHistory, setRFQHistory] = useState<RFQSubmission[]>([]);
  const [rfqLoading, setRFQLoading] = useState(true);
  const [rfqError, setRFQError] = useState<string | null>(null);
  
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

  const loadAnalysisHistory = useCallback(async () => {
    if (!userId) {
      setAnalysisHistory([]);
      setAnalysisError('Unable to load AI analyses: missing account context.');
      setAnalysisLoading(false);
      return;
    }

    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('drawing_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('analyzed_at', { ascending: false })
        .limit(15);

      if (error) throw error;
      setAnalysisHistory(data || []);
    } catch (err) {
      console.error('Error fetching analysis history:', err);
      setAnalysisError(err instanceof Error ? err.message : 'Failed to fetch analysis history');
      setAnalysisHistory([]);
    } finally {
      setAnalysisLoading(false);
    }
  }, [userId]);

  const loadRFQHistory = useCallback(async () => {
    if (!userId) {
      setRFQHistory([]);
      setRFQError('Unable to load RFQs: missing account context.');
      setRFQLoading(false);
      return;
    }

    setRFQLoading(true);
    setRFQError(null);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('rfq_submissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) throw error;
      setRFQHistory(data || []);
    } catch (err) {
      console.error('Error fetching RFQ history:', err);
      setRFQError(err instanceof Error ? err.message : 'Failed to fetch RFQ history');
      setRFQHistory([]);
    } finally {
      setRFQLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAnalysisHistory();
  }, [loadAnalysisHistory]);

  useEffect(() => {
    loadRFQHistory();
  }, [loadRFQHistory]);

  const handleRefresh = () => {
    if (activeTab === 'generations') {
      refresh();
    } else if (activeTab === 'analyses') {
      loadAnalysisHistory();
    } else {
      loadRFQHistory();
    }
  };

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

  const extractSpecPairs = (specs: unknown) => {
    if (!specs || typeof specs !== 'object') return [];
    return Object.entries(specs as Record<string, string | null>)
      .filter(([, value]) => typeof value === 'string' && value)
      .slice(0, 4);
  };

  const extractRecommendations = (data: unknown) => {
    if (!Array.isArray(data)) return [];
    return data.slice(0, 3).map((item) => {
      if (typeof item === 'string') {
        return { name: item };
      }
      return {
        name: (item as any)?.name || 'Recommendation',
        category: (item as any)?.category || (item as any)?.type,
      };
    });
  };

  const formatDateOnly = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRFQStatusStyle = (status: string | null) => {
    const normalized = (status || 'submitted').toLowerCase();
    switch (normalized) {
      case 'awarded':
        return 'bg-emerald-100 text-emerald-700';
      case 'in_review':
      case 'review':
        return 'bg-amber-100 text-amber-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const formatFileSizeFromBytes = (bytes?: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const tabMeta: { key: HistoryTab; label: string; count: string | number }[] = [
    { key: 'generations', label: 'CAD Generations', count: loading ? '…' : totalCount },
    { key: 'analyses', label: 'AI Analyses', count: analysisLoading ? '…' : analysisHistory.length },
    { key: 'rfqs', label: 'RFQ Requests', count: rfqLoading ? '…' : rfqHistory.length },
  ];

  return (
    <div className="glass-container glass-container-with-liquid p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Activity History</h2>
          <p className="text-sm text-gray-600 mt-1">
            Review CAD generations, Gemini analyses, and RFQ submissions in one unified space.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M5 19A9 9 0 0119 5" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabMeta.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white text-gray-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {activeTab === 'generations' && (
        <>
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status-filter"
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="glass-input"
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
            className="glass-input"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="glass-card-compact cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedItem(item);
                  setIsModalOpen(true);
                }}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
                    {item.prompt}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                      {item.format.toUpperCase()}
                    </span>
                    {item.category && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {item.category}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-3 border-t border-gray-100">
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
        </>
      )}

      {activeTab === 'analyses' && (
        <div className="space-y-4">
          {analysisLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-2 text-gray-600">Loading AI analyses...</p>
            </div>
          )}

          {analysisError && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              {analysisError}
            </div>
          )}

          {!analysisLoading && !analysisError && analysisHistory.length === 0 && (
            <div className="text-center py-10">
              <svg className="w-12 h-12 mx-auto text-purple-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 8h10M5 5h14" />
              </svg>
              <p className="text-gray-600">No analyses stored yet</p>
              <p className="text-sm text-gray-500">Run the CAD Analyzer to view saved reports.</p>
            </div>
          )}

          {!analysisLoading && !analysisError && analysisHistory.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysisHistory.map((item) => {
                const specPairs = extractSpecPairs(item.extracted_specs);
                const recommendations = extractRecommendations(item.recommended_products);
                const confidence = Math.round((item.confidence || 0) * 100);

                return (
                  <div
                    key={item.id}
                    className="glass-card-compact hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                        </div>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                          {confidence}%
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
                        {item.file_name}
                      </h3>
                      
                      {specPairs.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {specPairs.slice(0, 2).map(([label, value]) => (
                            <span key={`${item.id}-${label}`} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                              {label}: {value as string}
                            </span>
                          ))}
                          {specPairs.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{specPairs.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                      
                      {recommendations.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Recommendations:</p>
                          <div className="flex flex-wrap gap-1">
                            {recommendations.slice(0, 2).map((rec, idx) => (
                              <span key={`${item.id}-rec-${idx}`} className="px-2 py-1 bg-white border border-purple-100 text-purple-700 text-xs rounded">
                                {rec.name}
                              </span>
                            ))}
                            {recommendations.length > 2 && (
                              <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                                +{recommendations.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-auto pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          {formatDate(item.analyzed_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'rfqs' && (
        <div className="space-y-4">
          {rfqLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <p className="mt-2 text-gray-600">Loading RFQ submissions...</p>
            </div>
          )}

          {rfqError && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              {rfqError}
            </div>
          )}

          {!rfqLoading && !rfqError && rfqHistory.length === 0 && (
            <div className="text-center py-10">
              <svg className="w-12 h-12 mx-auto text-emerald-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v10l9-5-9-5z" />
              </svg>
              <p className="text-gray-600">No RFQ submissions yet</p>
              <p className="text-sm text-gray-500">Submit a request for quote to track it here.</p>
            </div>
          )}

          {!rfqLoading && !rfqError && rfqHistory.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rfqHistory.map((rfq) => (
                <div
                  key={rfq.id}
                  className="glass-card-compact hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRFQStatusStyle(rfq.status)}`}>
                        {(rfq.status || 'Submitted').replace(/_/g, ' ')}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
                      {rfq.project_description}
                    </h3>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full">
                        Qty: {rfq.quantity?.toLocaleString()}
                      </span>
                      {rfq.material && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {rfq.material}
                        </span>
                      )}
                    </div>
                    
                    {rfq.specifications && (
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {rfq.specifications}
                      </p>
                    )}
                    
                    <div className="mt-auto pt-3 border-t border-gray-100 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Deadline:</span>
                        <span className="font-medium text-gray-700">{formatDateOnly(rfq.deadline)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(rfq.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
