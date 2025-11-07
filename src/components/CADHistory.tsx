'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface CADHistoryItem {
  id: string;
  prompt: string;
  category: string;
  format: string;
  units: string;
  model_data: string;
  generated_at: string;
  status: 'completed' | 'failed';
  error?: string;
  conversation_id?: string;
}

interface CADHistoryProps {
  onSelectHistory?: (item: CADHistoryItem) => void;
  className?: string;
}

const CADHistory: React.FC<CADHistoryProps> = ({ onSelectHistory, className = '' }) => {
  const [history, setHistory] = useState<CADHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [loadingModelIds, setLoadingModelIds] = useState<Set<string>>(new Set());

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      
      // First try to fetch from Zoo Dev API
      // Note: no_models=true to exclude model data for faster loading (will load on demand)
      const zooResponse = await fetch('/api/zoo-parts?limit=5&sort_by=created_at_descending&no_models=true');
      const zooResult = await zooResponse.json();
      
      if (zooResult.success && zooResult.data?.items?.length > 0) {
        // Convert Zoo Dev format to our format
        // Don't load model data here - it will be loaded on demand when "View Drawing" is clicked
        const convertedHistory = zooResult.data.items.map((item: any) => ({
          id: item.id,
          prompt: item.prompt || 'No prompt available',
          category: 'custom', // Zoo Dev doesn't provide category
          format: item.format || 'step', // Use format from API if available
          units: item.units || 'mm', // Use units from API if available
          model_data: '', // Don't load model data initially - load on demand
          generated_at: item.created_at,
          status: item.status === 'completed' ? 'completed' : 'failed',
          error: item.error,
          conversation_id: item.conversation_id
        }));
        
        setHistory(convertedHistory);
        setError('');
      } else {
        // Fallback to local history
        const localResponse = await fetch('/api/cad-history?limit=20');
        const localResult = await localResponse.json();
        
        if (localResult.success) {
          setHistory(localResult.data || []);
          setError('');
        } else {
          setError(localResult.error || 'Failed to load history');
        }
      }
    } catch (err: any) {
      setError(`Failed to fetch history: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear all generation history?')) {
      return;
    }

    try {
      const response = await fetch('/api/cad-history', { method: 'DELETE' });
      const result = await response.json();
      
      if (result.success) {
        setHistory([]);
      } else {
        alert('Failed to clear history');
      }
    } catch (err) {
      alert('Failed to clear history');
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      const response = await fetch(`/api/cad-history?id=${id}`, { method: 'DELETE' });
      const result = await response.json();
      
      if (result.success) {
        setHistory(prev => prev.filter(item => item.id !== id));
      } else {
        alert('Failed to delete item');
      }
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  const downloadModel = (item: CADHistoryItem) => {
    if (!item.model_data) return;
    
    try {
      const binaryString = atob(item.model_data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.prompt.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.${item.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      alert('Failed to download file');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const viewDrawing = async (item: CADHistoryItem) => {
    console.log('View Drawing clicked for item:', item.id, {
      hasModelData: !!item.model_data,
      modelDataLength: item.model_data?.length || 0,
      status: item.status,
      onSelectHistory: !!onSelectHistory
    });
    
    // Always fetch model data from Zoo Dev API when viewing (for consistency and to ensure latest data)
    if (item.id && item.status === 'completed') {
      // Set loading state
      setLoadingModelIds(prev => new Set(prev).add(item.id));
      
      try {
        const response = await fetch(`/api/zoo-parts/${item.id}`);
        const result = await response.json();
        
        console.log('Fetch result:', result);
        
        // Check for API errors first
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch model data');
        }
        
        // Try multiple possible locations for model data
        let modelData = null;
        
        if (result.data?.model_data) {
          modelData = result.data.model_data;
        } else if (result.data?.outputs) {
          // Model data might be in outputs object
          const outputValues = Object.values(result.data.outputs);
          if (outputValues.length > 0) {
            modelData = outputValues[0];
          }
        } else if (result.data?.data?.model_data) {
          modelData = result.data.data.model_data;
        } else if (result.data?.data?.outputs) {
          const outputValues = Object.values(result.data.data.outputs);
          if (outputValues.length > 0) {
            modelData = outputValues[0];
          }
        }
        
        if (modelData) {
          // Update the item with model data
          const updatedItem = {
            ...item,
            model_data: modelData
          };
          
          // Update in history state
          setHistory(prev => prev.map(h => h.id === item.id ? updatedItem : h));
          
          // Clear loading state
          setLoadingModelIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(item.id);
            return newSet;
          });
          
          if (onSelectHistory) {
            onSelectHistory(updatedItem);
          }
          return;
        } else {
          // Clear loading state on error
          setLoadingModelIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(item.id);
            return newSet;
          });
          
          console.error('Model data not found in response:', result);
          alert(`Could not load model data. The API response did not contain model data. ${result.error ? `Error: ${result.error}` : 'Please check the console for details.'}`);
          return;
        }
      } catch (error: any) {
        console.error('Failed to fetch model data:', error);
        // Clear loading state on error
        setLoadingModelIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });
        alert(`Could not load model data: ${error.message || 'Unknown error'}. Please check the browser console for more details.`);
        return;
      }
    }
    
    // If we reach here and model data still doesn't exist, show error
    if (!item.model_data) {
      console.error('Model data still not available after fetch attempt');
      alert('Could not load model data. The drawing may not be available or the API request failed.');
      return;
    }
    
    // Use the model data (either from fetch or existing)
    if (onSelectHistory) {
      console.log('Calling onSelectHistory with item:', {
        id: item.id,
        hasModelData: !!item.model_data,
        modelDataLength: item.model_data?.length || 0
      });
      onSelectHistory(item);
    } else {
      console.error('onSelectHistory callback is not defined!');
      alert('Error: Cannot load drawing. The history callback is not configured.');
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (!isExpanded) {
    return (
      <div className={`bg-white rounded-lg shadow border p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">Generation History</h3>
            {history.length > 0 && (
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                {history.length} items
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(true)}
          >
            View History
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow border ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">Generation History</h3>
            {history.length > 0 && (
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                {history.length} items
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHistory}
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Refresh'}
            </Button>
            {history.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearHistory}
                className="text-red-600 hover:text-red-700"
              >
                Clear All
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              Collapse
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
            <span className="ml-2 text-gray-600">Loading history...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">{error}</div>
            <Button variant="outline" onClick={fetchHistory}>
              Try Again
            </Button>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>No CAD generations yet</p>
            <p className="text-sm">Your generation history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history.map((item) => {
              const isItemExpanded = expandedItems.has(item.id);
              const hasModel = item.status === 'completed' && item.model_data;
              
              return (
                <div
                  key={item.id}
                  className={`border rounded-lg transition-all hover:shadow-sm ${
                    item.status === 'failed' ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  } ${isItemExpanded ? 'shadow-md' : ''}`}
                >
                  {/* Collapsed Header */}
                  <div className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${
                            item.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className="text-xs text-gray-500 uppercase tracking-wide">
                            {item.category} • {item.format} • {item.units}
                          </span>
                        </div>
                        <p className={`text-sm font-medium text-gray-900 mb-1 ${
                          !isItemExpanded ? 'truncate' : ''
                        }`}>
                          {item.prompt}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(item.generated_at)}
                        </p>
                        {item.error && !isItemExpanded && (
                          <p className="text-xs text-red-600 mt-1 truncate">
                            Error: {item.error}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => toggleItemExpansion(item.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title={isItemExpanded ? 'Collapse' : 'Expand'}
                        >
                          <svg 
                            className={`w-4 h-4 transition-transform ${isItemExpanded ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {hasModel && (
                          <button
                            onClick={() => downloadModel(item)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Download"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => deleteHistoryItem(item.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isItemExpanded && (
                    <div className="px-3 pb-3 border-t border-gray-200 pt-3 space-y-3">
                      {/* Full Description */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                          Full Description
                        </h4>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap break-words">
                          {item.prompt || 'No description available'}
                        </p>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Category</span>
                          <p className="text-sm text-gray-900 mt-1">{item.category}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Format</span>
                          <p className="text-sm text-gray-900 mt-1">{item.format.toUpperCase()}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Units</span>
                          <p className="text-sm text-gray-900 mt-1">{item.units}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Status</span>
                          <p className={`text-sm mt-1 font-medium ${
                            item.status === 'completed' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.status === 'completed' ? 'Completed' : 'Failed'}
                          </p>
                        </div>
                      </div>

                      {/* Conversation ID (from Zoo Dev) */}
                      {item.conversation_id && (
                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Conversation ID</span>
                          <p className="text-xs text-gray-500 font-mono mt-1 bg-gray-50 p-2 rounded border border-gray-200 break-all">
                            {item.conversation_id}
                          </p>
                        </div>
                      )}

                      {/* Error Details */}
                      {item.error && (
                        <div>
                          <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">
                            Error Details
                          </h4>
                          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                            {item.error}
                          </p>
                        </div>
                      )}

                      {/* Drawing Actions */}
                      {item.status === 'completed' && (
                        <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
                          <Button
                            onClick={() => viewDrawing(item)}
                            disabled={loadingModelIds.has(item.id)}
                            className="flex items-center space-x-2"
                          >
                            {loadingModelIds.has(item.id) ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Loading...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>View Drawing</span>
                              </>
                            )}
                          </Button>
                          {hasModel && (
                            <Button
                              variant="outline"
                              onClick={() => downloadModel(item)}
                              className="flex items-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>Download</span>
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Model Info */}
                      {item.status === 'completed' && (
                        <div className="pt-2 border-t border-gray-200">
                          {hasModel ? (
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>Model data available ({Math.round(item.model_data.length / 1024)} KB)</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Click "View Drawing" to load model data from Zoo Dev API</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CADHistory;
