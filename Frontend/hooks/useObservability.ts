'use client';

import { useEffect, useCallback, useState } from 'react';
import { useLogger } from './useLogger';

// Performance metrics interface
export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  
  // Navigation timing
  navigationStart?: number;
  domContentLoaded?: number;
  loadComplete?: number;
  
  // Resource timing
  resourceLoadTimes?: Record<string, number>;
  
  // Custom metrics
  customMetrics?: Record<string, number>;
}

// User interaction tracking
export interface UserInteraction {
  type: 'click' | 'scroll' | 'navigation' | 'form_submit' | 'error';
  target?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Hook for performance monitoring
export function usePerformanceMonitoring() {
  const { logInfo, logWarn } = useLogger();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});

  // Measure Core Web Vitals
  useEffect(() => {
    if (typeof window === 'undefined' || !window.performance) return;

    const measureCoreWebVitals = async () => {
      try {
        // Dynamic import to avoid bundling if not supported
        const { getCLS, getFID, getLCP } = await import('web-vitals');

        getCLS((metric) => {
          setMetrics(prev => ({ ...prev, cls: metric.value }));
          logInfo('Core Web Vital - CLS', { value: metric.value });
        });

        getFID((metric) => {
          setMetrics(prev => ({ ...prev, fid: metric.value }));
          logInfo('Core Web Vital - FID', { value: metric.value });
        });

        getLCP((metric) => {
          setMetrics(prev => ({ ...prev, lcp: metric.value }));
          logInfo('Core Web Vital - LCP', { value: metric.value });
        });
      } catch (error) {
        logWarn('Failed to measure Core Web Vitals', { error });
      }
    };

    measureCoreWebVitals();
  }, [logInfo, logWarn]);

  // Measure navigation timing
  useEffect(() => {
    if (typeof window === 'undefined' || !window.performance) return;

    const measureNavigationTiming = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const navigationMetrics = {
          navigationStart: navigation.navigationStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        };

        setMetrics(prev => ({ ...prev, ...navigationMetrics }));
        logInfo('Navigation timing measured', navigationMetrics);
      }
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measureNavigationTiming();
    } else {
      window.addEventListener('load', measureNavigationTiming);
      return () => window.removeEventListener('load', measureNavigationTiming);
    }
  }, [logInfo]);

  // Track custom performance metrics
  const trackCustomMetric = useCallback((name: string, value: number) => {
    setMetrics(prev => ({
      ...prev,
      customMetrics: {
        ...prev.customMetrics,
        [name]: value,
      },
    }));

    logInfo('Custom metric tracked', { name, value });
  }, [logInfo]);

  // Measure function execution time
  const measureExecutionTime = useCallback((name: string, fn: () => void | Promise<void>) => {
    const start = performance.now();
    
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        trackCustomMetric(`${name}_duration`, duration);
      });
    } else {
      const duration = performance.now() - start;
      trackCustomMetric(`${name}_duration`, duration);
      return result;
    }
  }, [trackCustomMetric]);

  return {
    metrics,
    trackCustomMetric,
    measureExecutionTime,
  };
}

// Hook for user interaction tracking
export function useUserTracking() {
  const [interactions, setInteractions] = useState<UserInteraction[]>([]);

  // Track user interactions on demand without heavy global DOM listeners
  const trackInteraction = useCallback((interaction: Omit<UserInteraction, 'timestamp'>) => {
    const fullInteraction: UserInteraction = {
      ...interaction,
      timestamp: Date.now(),
    };

    setInteractions(prev => [...prev.slice(-49), fullInteraction]);
  }, []);

  return {
    interactions,
    trackInteraction,
  };
}

// Hook for error boundary integration
export function useErrorTracking() {
  const { logError } = useLogger();

  const trackError = useCallback((error: Error, errorInfo?: { componentStack: string }) => {
    logError(error, {
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  }, [logError]);

  return {
    trackError,
  };
}

// Combined observability hook
export function useObservability() {
  const performance = usePerformanceMonitoring();
  const userTracking = useUserTracking();
  const errorTracking = useErrorTracking();
  const { logInfo, logError, logWarn, logDebug, flush } = useLogger();

  return {
    // Performance monitoring
    performanceMetrics: performance.metrics,
    trackCustomMetric: performance.trackCustomMetric,
    measureExecutionTime: performance.measureExecutionTime,
    
    // User tracking
    userInteractions: userTracking.interactions,
    trackInteraction: userTracking.trackInteraction,
    
    // Error tracking
    trackError: errorTracking.trackError,
    
    // Logging
    logInfo,
    logError,
    logWarn,
    logDebug,
    flushLogs: flush,
  };
}