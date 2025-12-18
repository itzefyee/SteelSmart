'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CADHistory } from '@/lib/supabase';

interface CADHistoryDetailModalProps {
  item: CADHistory | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (itemId: string) => Promise<void>;
}

export default function CADHistoryDetailModal({
  item,
  isOpen,
  onClose,
  onDelete,
}: CADHistoryDetailModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!item || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(item.id);
      onClose();
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleViewDrawing = () => {
    if (!item) return;
    
    // Store the generation data in sessionStorage with scroll flag
    sessionStorage.setItem('restoredGeneration', JSON.stringify({
      prompt: item.prompt,
      format: item.format,
      units: item.units,
      category: item.category,
      model_data_url: item.model_data_url,
      status: item.status,
      shouldScrollToPreview: true, // Flag to trigger auto-scroll
    }));
    
    // Navigate to CAD Generator
    router.push('/cad-generator?restored=true');
  };

  // Close modal on Escape key (don't prevent body scroll)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container - Centered with padding */}
      <div className="relative min-h-screen flex items-center justify-center p-4" onClick={onClose}>
        {/* Modal */}
        <div 
          className="relative w-full max-w-3xl my-8 flex flex-col max-h-[85vh] rounded-xl shadow-2xl" 
          style={{ backgroundColor: '#f8fafc' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed */}
          <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl" style={{ backgroundColor: '#f8fafc' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">CAD Generation Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6" style={{ backgroundColor: '#f8fafc' }}>
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full ${
                  item.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : item.status === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : item.status === 'processing'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {item.status === 'completed' && '✅'}
                {item.status === 'failed' && '❌'}
                {item.status === 'processing' && '⏳'}
                {item.status || 'Unknown'}
              </span>
              <span className="text-xs text-gray-500">{formatDate(item.generated_at)}</span>
            </div>

            {/* Prompt Card */}
            <div className="glass-card p-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Generation Prompt</h3>
                  <p className="text-gray-900 leading-relaxed">{item.prompt}</p>
                </div>
              </div>
            </div>

            {/* Specifications Grid */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Specifications
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <span className="text-xs text-blue-600 font-medium">Format</span>
                  <p className="text-gray-900 font-semibold mt-1">{item.format.toUpperCase()}</p>
                </div>
                {item.units && (
                  <div className="bg-purple-50 rounded-lg p-3">
                    <span className="text-xs text-purple-600 font-medium">Units</span>
                    <p className="text-gray-900 font-semibold mt-1">{item.units}</p>
                  </div>
                )}
                {item.category && (
                  <div className="bg-amber-50 rounded-lg p-3">
                    <span className="text-xs text-amber-600 font-medium">Category</span>
                    <p className="text-gray-900 font-semibold mt-1 capitalize">{item.category}</p>
                  </div>
                )}
                {item.file_size && (
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <span className="text-xs text-emerald-600 font-medium">File Size</span>
                    <p className="text-gray-900 font-semibold mt-1">{formatFileSize(item.file_size)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message (if failed) */}
            {item.status === 'failed' && item.error && (
              <div className="glass-card p-5 bg-red-50 border-2 border-red-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-800 mb-2">Error Message</h3>
                    <p className="text-red-700 text-sm">{item.error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons (if completed) */}
            {item.status === 'completed' && item.model_data_url && (
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Actions
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleViewDrawing}
                    className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Drawing
                  </button>
                  <a
                    href={item.model_data_url}
                    download
                    className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Model
                  </a>
                </div>
              </div>
            )}

            {/* Metadata (if available) */}
            {item.metadata && typeof item.metadata === 'object' && Object.keys(item.metadata).length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Additional Metadata</h3>
                <pre className="bg-gray-50 p-4 rounded-md border border-gray-200 text-xs overflow-x-auto">
                  {JSON.stringify(item.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 flex justify-between items-center rounded-b-xl" style={{ backgroundColor: '#f8fafc' }}>
          {/* Delete Button */}
          {onDelete && !showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">⚠️ Are you sure?</span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Confirm Delete'
                )}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {!showDeleteConfirm && <div />}

          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Close
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
