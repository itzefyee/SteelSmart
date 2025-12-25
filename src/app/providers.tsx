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
            // Simple, reliable caching for both user and admin
            staleTime: 2 * 60 * 1000, // 2 minutes - fresh enough for admin
            gcTime: 5 * 60 * 1000, // 5 minutes - reasonable cleanup
            refetchOnMount: true, // Always get fresh data when component mounts
            refetchOnWindowFocus: false, // Don't refetch on focus (annoying for admin)
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors (client errors)
              if (error && typeof error === 'object' && 'status' in error) {
                const status = (error as any).status;
                if (status >= 400 && status < 500) return false;
              }
              return failureCount < 1; // Only retry once for server errors
            },
            retryDelay: 1000, // Simple 1 second delay
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
