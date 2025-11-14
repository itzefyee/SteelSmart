import { useState, useCallback } from 'react';
import { formatFileSize, isValidFileType, isValidFileSize } from '@/lib/utils';

export interface FileUploadOptions {
  allowedTypes?: string[];
  maxSizeInMB?: number;
  onSuccess?: (file: File) => void;
  onError?: (error: string) => void;
}

export interface FileUploadState {
  file: File | null;
  preview: string | null;
  error: string | null;
  isUploading: boolean;
}

export const useFileUpload = (options: FileUploadOptions = {}) => {
  const {
    allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'],
    maxSizeInMB = 10,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<FileUploadState>({
    file: null,
    preview: null,
    error: null,
    isUploading: false,
  });

  const handleFileSelect = useCallback(
    async (file: File) => {
      setState((prev) => ({ ...prev, isUploading: true, error: null }));

      try {
        // Validate file type
        if (!isValidFileType(file, allowedTypes)) {
          const error = `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`;
          setState((prev) => ({ ...prev, error, isUploading: false }));
          onError?.(error);
          return;
        }

        // Validate file size
        if (!isValidFileSize(file, maxSizeInMB)) {
          const error = `File too large. Maximum size: ${formatFileSize(maxSizeInMB * 1024 * 1024)}`;
          setState((prev) => ({ ...prev, error, isUploading: false }));
          onError?.(error);
          return;
        }

        // Create preview for images
        let preview: string | null = null;
        if (file.type.startsWith('image/')) {
          preview = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }

        setState({
          file,
          preview,
          error: null,
          isUploading: false,
        });

        onSuccess?.(file);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isUploading: false,
        }));
        onError?.(errorMessage);
      }
    },
    [allowedTypes, maxSizeInMB, onSuccess, onError]
  );

  const clearFile = useCallback(() => {
    setState({
      file: null,
      preview: null,
      error: null,
      isUploading: false,
    });
  }, []);

  return {
    ...state,
    handleFileSelect,
    clearFile,
  };
};
