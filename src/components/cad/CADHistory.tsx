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
  model_data: string; // Base64 model data (loaded on demand)
  model_data_url?: string; // Public URL to Supabase Storage
  file_path?: string; // Storage bucket path
  generated_at: string;
  status: 'completed' | 'failed';
  error?: string;
  zoo_operation_id?: string; // For reference only
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

  /**
   * Manual Cache Invalidation Support
   * 
   * TODO: When migrating to React Query, replace this manual fetch with useCADHistory hook:
   * 
   * const { data, isLoading, error, refetch } = useCADHistory(20, 0);
   * 
   * Then use the refetch function for the Refresh button:
   * <Button onClick={() => refetch()}>Refresh</Button>
   * 
   * This will leverage React Query's cache invalidation and provide:
   * - Automatic background refetching when data becomes stale
   * - Optimistic updates when new CAD models are generated
   * - Manual refetch support via the refetch function
   * - Better loading states and error handling
   * 
   * Requirements: 10.4 (Manual cache invalidation via refetch function)
   */
  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      
      // Fetch from Supabase cad_history table
      const response = await fetch('/api/cad-history?limit=20');
      const result = await response.json();
      
      if (result.success) {
        // Map the data to include model_data_url from Supabase Storage
        const historyItems = (result.data || []).map((item: any) => ({
          id: item.id,
          prompt: item.prompt || 'No prompt available',
          category: item.category || 'custom',
          format: item.format || 'step',
          units: item.units || 'mm',
          model_data: '', // Will be loaded on demand from model_data_url
          model_data_url: item.model_data_url, // Public URL to download from Supabase Storage
          file_path: item.file_path, // Storage path
          generated_at: item.generated_at,
          status: item.status || 'completed',
          error: item.error,
          zoo_operation_id: item.zoo_operation_id
        }));
        
        setHistory(historyItems);
        setError('');
      } else {
        setError(result.error || 'Failed to load history');
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
      
      // Determine MIME type based on format
      const mimeTypes: Record<string, string> = {
        'step': 'application/step',
        'stp': 'application/step',
        'stl': 'model/stl',
        'obj': 'model/obj',
        'dxf': 'application/dxf',
        'gltf': 'model/gltf+json',
        'glb': 'model/gltf-binary',
      };
      
      const mimeType = mimeTypes[item.format?.toLowerCase() || ''] || 'application/octet-stream';
      const blob = new Blob([bytes], { type: mimeType });
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
    
    // Load model data from Supabase Storage if not already loaded
    if (item.status === 'completed' && !item.model_data && item.file_path) {
      // Set loading state
      setLoadingModelIds(prev => new Set(prev).add(item.id));
      
      try {
        // Use Supabase client to get public URL (bucket must be public)
        const { supabase } = await import('@/lib/supabase');
        
        const { data: publicUrlData } = supabase.storage
          .from('cad-models')
          .getPublicUrl(item.file_path);
        
        if (!publicUrlData?.publicUrl) {
          throw new Error('No public URL returned from Supabase');
        }
        
        // Fetch the file using the public URL
        const response = await fetch(publicUrlData.publicUrl, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
          headers: {
            'Accept': 'application/octet-stream, model/step, application/step, */*'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        // Get the file as array buffer
        const arrayBuffer = await response.arrayBuffer();
        
        // Convert to base64
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const modelData = btoa(binary);
        
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
      } catch (error: any) {
        // Clear loading state on error
        setLoadingModelIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });
        
        // Show user-friendly error message
        alert(`Failed to load model: ${error.message || 'Unknown error'}. Please try again or contact support if the issue persists.`);
        setLoadingModelIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });
        
        // Show detailed error message
        const errorDetails = [
          `Error: ${error.message}`,
          '',
          'Troubleshooting steps:',
          '1. Open the URL in a new browser tab to test direct access:',
          `   ${item.model_data_url}`,
          '',
          '2. Check Supabase Dashboard → Storage → cad-models',
          `   Verify file exists at: ${item.file_path}`,
          '',
          '3. Verify bucket is public:',
          '   Dashboard → Storage → cad-models → Settings → Public bucket = ON',
          '',
          '4. Check browser console for detailed error logs',
          '',
          'If the file exists but still fails, this may be a CORS or RLS policy issue.'
        ].join('\n');
        
        alert(errorDetails);
        return;
      }
    }
    
    // If model data already exists, use it directly
    if (item.model_data) {
      if (onSelectHistory) {
        onSelectHistory(item);
      }
      return;
    }
    
    // If we reach here, no model data is available
    const errorDetails = [
      'Could not load model data.',
      '',
      'Possible causes:',
      '1. File was not saved during generation (check if model_data_url exists)',
      '2. Storage upload failed (check API logs for upload errors)',
      '3. This is an old generation from before storage was implemented',
      '',
      'Item details:',
      `- ID: ${item.id}`,
      `- Has URL: ${!!item.model_data_url}`,
      `- Has Path: ${!!item.file_path}`,
      `- Status: ${item.status}`
    ].join('\n');
    
    alert(errorDetails);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (!isExpanded) {
    return (
      <div className={`glass-card overflow-hidden ${className}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex items-center space-x-3 pl-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-medium">History</p>
              <h3 className="text-xl font-bold text-slate-900">Generation Log</h3>
            </div>
          </div>
          <div className="flex items-center gap-2 pr-1">
            {history.length > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                {history.length} saved
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="border-slate-300 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-400"
            >
              View History
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-medium">History</p>
            <h3 className="text-xl font-bold text-slate-900">Generation Log</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHistory}
            disabled={isLoading}
            className="border-slate-300 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-400"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Refresh'}
          </Button>
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
            >
              Clear All
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Collapse
          </Button>
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
                  className={`group border rounded-xl transition-all duration-200 ${
                    item.status === 'failed' 
                      ? 'border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 hover:shadow-lg hover:shadow-red-200/50' 
                      : 'border-slate-200 bg-gradient-to-br from-white to-slate-50/50 hover:shadow-lg hover:shadow-blue-200/40 hover:border-blue-300'
                  } ${isItemExpanded ? 'shadow-lg ring-2 ring-blue-200' : 'shadow-sm'}`}
                >
                  {/* Collapsed Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                            item.status === 'completed' 
                              ? 'bg-green-500 ring-2 ring-green-200' 
                              : 'bg-red-500 ring-2 ring-red-200'
                          }`} />
                          <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase">
                              {item.category}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 uppercase">
                              {item.format}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 uppercase">
                              {item.units}
                            </span>
                          </div>
                        </div>
                        <p className={`text-sm font-semibold text-slate-900 mb-2 leading-relaxed ${
                          !isItemExpanded ? 'line-clamp-2' : ''
                        }`}>
                          {item.prompt}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">{formatDate(item.generated_at)}</span>
                        </div>
                        {item.error && !isItemExpanded && (
                          <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600 bg-red-100 border border-red-200 rounded-lg px-2 py-1.5">
                            <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="line-clamp-1 font-medium">{item.error}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <button
                          onClick={() => toggleItemExpansion(item.id)}
                          className={`p-2 rounded-lg transition-all ${
                            isItemExpanded 
                              ? 'bg-blue-100 text-blue-700 shadow-sm' 
                              : 'bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-blue-700 hover:shadow-sm'
                          }`}
                          title={isItemExpanded ? 'Collapse' : 'Expand'}
                        >
                          <svg 
                            className={`w-4 h-4 transition-transform duration-200 ${isItemExpanded ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {hasModel && (
                          <button
                            onClick={() => downloadModel(item)}
                            className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-green-100 hover:text-green-700 hover:shadow-sm transition-all"
                            title="Download"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => deleteHistoryItem(item.id)}
                          className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-700 hover:shadow-sm transition-all"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

                      {/* Storage Info */}
                      {item.file_path && (
                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Storage Path</span>
                          <p className="text-xs text-gray-500 font-mono mt-1 bg-gray-50 p-2 rounded border border-gray-200 break-all">
                            {item.file_path}
                          </p>
                        </div>
                      )}
                      {item.zoo_operation_id && (
                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Generation ID</span>
                          <p className="text-xs text-gray-500 font-mono mt-1 bg-gray-50 p-2 rounded border border-gray-200 break-all">
                            {item.zoo_operation_id}
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
                            <>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  if (!item.model_data) return;
                                  
                                  try {
                                    // Store file data in sessionStorage for the analyzer
                                    const fileData = {
                                      name: `${item.prompt.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.${item.format}`,
                                      data: item.model_data.startsWith('data:') ? item.model_data : `data:application/octet-stream;base64,${item.model_data}`,
                                      type: item.format,
                                      timestamp: Date.now()
                                    };
                                    
                                    sessionStorage.setItem('cadFileToAnalyze', JSON.stringify(fileData));
                                    
                                    // Redirect to analyzer
                                    window.location.href = '/cad-analyzer?autoAnalyze=true';
                                  } catch (error) {
                                    console.error('Error preparing file for analysis:', error);
                                    alert('Failed to prepare file for analysis. Please try downloading and uploading manually.');
                                  }
                                }}
                                className="flex items-center space-x-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span>Analyze Drawing</span>
                              </Button>
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
                            </>
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
                              <span>Model data loaded ({Math.round(item.model_data.length / 1024)} KB)</span>
                            </div>
                          ) : item.model_data_url ? (
                            <div className="flex items-center space-x-2 text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Click "View Drawing" to load model from Supabase Storage</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span>Model file not available (may have failed to upload)</span>
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
