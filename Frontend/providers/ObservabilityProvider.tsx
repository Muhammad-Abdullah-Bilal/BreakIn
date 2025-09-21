'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useObservability } from '@/hooks/useObservability';

interface ObservabilityContextType {
  trackCustomMetric: (name: string, value: number) => void;
  measureExecutionTime: (name: string, fn: () => void | Promise<void>) => void;
  trackInteraction: (interaction: { type: 'click' | 'scroll' | 'navigation' | 'form_submit' | 'error', target?: string, metadata?: Record<string, any> }) => void;
  trackError: (error: Error, errorInfo?: { componentStack: string }) => void;
  logInfo: (message: string, context?: Record<string, any>) => void;
  logError: (error: Error, context?: Record<string, any>) => void;
  logWarn: (message: string, context?: Record<string, any>) => void;
  logDebug: (message: string, context?: Record<string, any>) => void;
}

const ObservabilityContext = createContext<ObservabilityContextType | null>(null);

interface ObservabilityProviderProps {
  children: React.ReactNode;
  enableTracking?: boolean;
}

export function ObservabilityProvider({ 
  children, 
  enableTracking = true 
}: ObservabilityProviderProps) {
  const observability = useObservability();

  // Initialize global error handling
  useEffect(() => {
    if (!enableTracking || typeof window === 'undefined') return;

    // Enhance error tracking with additional context
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      if (error) {
        observability.trackError(error);
      } else {
        observability.logError(new Error(message as string), {
          source,
          lineno,
          colno,
        });
      }
      
      // Call original handler if it exists
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    // Enhanced unhandled promise rejection tracking
    const originalOnUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = (event) => {
      observability.trackError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      );
      
      if (originalOnUnhandledRejection) {
        originalOnUnhandledRejection.call(window, event);
      }
    };

    // Track page visibility changes
    const handleVisibilityChange = () => {
      observability.trackInteraction({
        type: 'navigation',
        target: 'visibility_change',
        metadata: {
          hidden: document.hidden,
          visibilityState: document.visibilityState,
        },
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.onerror = originalOnError;
      window.onunhandledrejection = originalOnUnhandledRejection;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enableTracking, observability]);

  // Flush logs on page unload
  useEffect(() => {
    if (!enableTracking || typeof window === 'undefined') return;

    const handleBeforeUnload = () => {
      observability.flushLogs();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enableTracking, observability]);

  const contextValue: ObservabilityContextType = {
    trackCustomMetric: observability.trackCustomMetric,
    measureExecutionTime: observability.measureExecutionTime,
    trackInteraction: observability.trackInteraction,
    trackError: observability.trackError,
    logInfo: observability.logInfo,
    logError: observability.logError,
    logWarn: observability.logWarn,
    logDebug: observability.logDebug,
  };

  return (
    <ObservabilityContext.Provider value={contextValue}>
      {children}
    </ObservabilityContext.Provider>
  );
}

export function useObservabilityContext() {
  const context = useContext(ObservabilityContext);
  if (!context) {
    throw new Error('useObservabilityContext must be used within an ObservabilityProvider');
  }
  return context;
}

// Convenience hooks for specific use cases
export function usePerformanceTracking() {
  const { trackCustomMetric, measureExecutionTime } = useObservabilityContext();
  return { trackCustomMetric, measureExecutionTime };
}

export function useInteractionTracking() {
  const { trackInteraction } = useObservabilityContext();
  return { trackInteraction };
}

export function useErrorReporting() {
  const { trackError, logError } = useObservabilityContext();
  return { trackError, logError };
}

export function useAppLogging() {
  const { logInfo, logError, logWarn, logDebug } = useObservabilityContext();
  return { logInfo, logError, logWarn, logDebug };
}