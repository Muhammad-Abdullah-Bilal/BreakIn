'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from './AuthProvider';
import { RealtimeProvider } from './RealtimeProvider';
import { ToastProvider } from './ToastProvider';
import { ObservabilityProvider } from './ObservabilityProvider';
import { ErrorBoundary } from '@/components/core/ErrorBoundary';

// Configure React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry for 4xx errors
        if (error instanceof Error && 'status' in error && (error as any).status >= 400 && (error as any).status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

// Global error fallback component
function GlobalErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md p-6 bg-card text-card-foreground rounded-lg border shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">
          The application encountered an unexpected error. This has been reported to our team.
        </p>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
          >
            Reload page
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-muted-foreground">Error details</summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Root provider composition following frozen contracts.
 * Order is critical: Theme → Query → Auth → Realtime → Toast → Observability → ErrorBoundary
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary fallback={GlobalErrorFallback}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RealtimeProvider>
              <ToastProvider>
                <ObservabilityProvider>
                  {children}
                  <ReactQueryDevtools initialIsOpen={false} />
                </ObservabilityProvider>
              </ToastProvider>
            </RealtimeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}