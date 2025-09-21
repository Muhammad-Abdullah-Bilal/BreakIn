'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useErrorTracking } from '@/hooks/useObservability';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// Hook-based error boundary wrapper for functional components
export function useErrorBoundary() {
  const { trackError } = useErrorTracking();
  
  return {
    captureError: (error: Error, errorInfo?: { componentStack: string }) => {
      trackError(error, errorInfo);
    }
  };
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to external service (Sentry, etc.)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Send to observability system
    if (typeof window !== 'undefined') {
      // Note: This would ideally use the hook, but class components can't use hooks
      // So we'll use the global logger directly
      import('@/hooks/useLogger').then(({ logger }) => {
        logger.error('ErrorBoundary caught error', error, {
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
        });
      });

      // Send to error tracking service (Sentry) - disabled for development
      // TODO: Install @sentry/nextjs package for production error tracking
      /*
      if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        try {
          import('@sentry/nextjs').then((Sentry) => {
            Sentry.captureException(error, {
              contexts: { react: errorInfo },
              tags: { errorBoundary: true },
            });
          }).catch(() => {
            // Sentry not available, ignore
            console.warn('Sentry not available for error tracking');
          });
        } catch (e) {
          // Sentry module not installed, ignore
          console.warn('Sentry module not found');
        }
      }
      */
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} reset={this.handleReset} />;
      }

      return <DefaultErrorFallback error={this.state.error} reset={this.handleReset} />;
    }

    return this.props.children;
  }
}