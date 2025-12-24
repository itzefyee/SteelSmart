'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/ui/ToastProvider';
// import SteelbotAssistant from '@/components/chatbot/SteelbotAssistant'; // Temporarily disabled

// Lazy load React Query DevTools to avoid SSR issues
const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then((mod) => ({
    default: mod.ReactQueryDevtools,
  }))
);

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Create QueryClient instance in state to ensure it's only created once per component lifecycle
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Always consider data stale (fetch fresh data every time)
            staleTime: 0,
            // Don't cache data in memory
            gcTime: 0,
            // Always refetch when component mounts
            refetchOnMount: true,
            // Refetch when window regains focus
            refetchOnWindowFocus: true,
            // Retry failed requests once before giving up
            retry: 1,
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {children}
          {/* <SteelbotAssistant /> */}{/* Temporarily disabled */}
          {/* React Query DevTools - only visible in development */}
          {process.env.NODE_ENV === 'development' && (
            <Suspense fallback={null}>
              <ReactQueryDevtools initialIsOpen={false} />
            </Suspense>
          )}
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
