'use client';

import { useEffect } from 'react';

export default function ChunkRetryHandler() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const handleError = (event: ErrorEvent) => {
      const { message, filename } = event;
      
      // Check if it's a chunk loading error
      if (
        message?.includes('Loading chunk') ||
        message?.includes('ChunkLoadError') ||
        filename?.includes('/_next/static/chunks/')
      ) {
        console.warn('Chunk loading error detected, attempting reload...');
        
        // Wait a bit then reload
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      if (
        error?.message?.includes('Loading chunk') ||
        error?.name === 'ChunkLoadError'
      ) {
        console.warn('Chunk loading promise rejection, attempting reload...');
        event.preventDefault(); // Prevent the error from being logged
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null; // This component doesn't render anything
}