'use client';

import { useEffect, useState } from 'react';
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

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
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

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900">CAD Generation Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Status */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
              <span
                className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                  item.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : item.status === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : item.status === 'processing'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {item.status || 'Unknown'}
              </span>
            </div>

            {/* Prompt */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Prompt</h3>
              <p className="text-gray-900 bg-gray-50 p-4 rounded-md border border-gray-200">
                {item.prompt}
              </p>
            </div>

            {/* Generation Details */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Generation Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Format:</span>
                  <p className="text-gray-900 font-medium">{item.format.toUpperCase()}</p>
                </div>
                {item.category && (
                  <div>
                    <span className="text-sm text-gray-600">Category:</span>
                    <p className="text-gray-900 font-medium">{item.category}</p>
                  </div>
                )}
                {item.units && (
                  <div>
                    <span className="text-sm text-gray-600">Units:</span>
                    <p className="text-gray-900 font-medium">{item.units}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-600">Generated:</span>
                  <p className="text-gray-900 font-medium">{formatDate(item.generated_at)}</p>
                </div>
                {item.file_size && (
                  <div>
                    <span className="text-sm text-gray-600">File Size:</span>
                    <p className="text-gray-900 font-medium">{formatFileSize(item.file_size)}</p>
                  </div>
                )}
                {item.zoo_operation_id && (
                  <div>
                    <span className="text-sm text-gray-600">Operation ID:</span>
                    <p className="text-gray-900 font-medium text-xs">{item.zoo_operation_id}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message (if failed) */}
            {item.status === 'failed' && item.error && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Error Message</h3>
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
                  {item.error}
                </div>
              </div>
            )}

            {/* 3D Preview (if available) */}
            {item.status === 'completed' && item.model_data_url && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">3D Model Preview</h3>
                <div className="bg-gray-100 border border-gray-200 rounded-md p-4 h-96 flex items-center justify-center">
                  <p className="text-gray-600">3D preview will be displayed here</p>
                  {/* TODO: Integrate CADPreview component when implementing 3D preview enhancement */}
                </div>
              </div>
            )}

            {/* Download Button (if available) */}
            {item.status === 'completed' && item.model_data_url && (
              <div>
                <a
                  href={item.model_data_url}
                  download
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Model
                </a>
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

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
            {/* Delete Button */}
            {onDelete && !showDeleteConfirm && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Delete
              </button>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">Are you sure?</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
