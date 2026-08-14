'use client';

import { useEffect, useCallback } from 'react';

// Logging levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Log entry interface
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  error?: Error;
}

// Global logging configuration
interface LoggingConfig {
  enabled: boolean;
  level: LogLevel;
  enableConsole: boolean;
  enableSentry: boolean;
  enableRemote: boolean;
  remoteUrl?: string;
  bufferSize: number;
  flushInterval: number;
}

class Logger {
  private config: LoggingConfig;
  private buffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: Partial<LoggingConfig> = {}) {
    this.config = {
      enabled: true,
      level: 'info',
      enableConsole: process.env.NODE_ENV === 'development',
      enableSentry: false,
      enableRemote: false,
      bufferSize: 100,
      flushInterval: 60000,
      ...config,
    };

    // Auto-flush logs periodically
    if (this.config.enabled && this.config.enableRemote) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const logLevelIndex = levels.indexOf(level);

    return logLevelIndex >= currentLevelIndex;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
    };
  }

  private getUserId(): string | undefined {
    // Get user ID from auth context or storage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_id') || undefined;
    }
    return undefined;
  }

  private getSessionId(): string | undefined {
    // Get or generate session ID
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('session_id', sessionId);
      }
      return sessionId;
    }
    return undefined;
  }

  private async logToConsole(entry: LogEntry) {
    if (!this.config.enableConsole) return;

    const consoleMethod = entry.level === 'error' ? 'error' : 
                         entry.level === 'warn' ? 'warn' : 
                         entry.level === 'debug' ? 'debug' : 'log';

    console[consoleMethod](
      `[${entry.timestamp.toISOString()}] ${entry.level.toUpperCase()}: ${entry.message}`,
      entry.context || '',
      entry.error || ''
    );
  }

  private async logToSentry(entry: LogEntry) {
    if (!this.config.enableSentry || typeof window === 'undefined') return;

    try {
      if (entry.level === 'error' && entry.error) {
        console.error('[Error Tracker]', entry.error, entry.context);
      }
    } catch (error) {
      console.warn('Failed to track error:', error);
    }
  }

  private async logToRemote(entries: LogEntry[]) {
    if (!this.config.enableRemote || !this.config.remoteUrl || entries.length === 0) return;

    try {
      await fetch(this.config.remoteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: entries.map(entry => ({
            ...entry,
            error: entry.error ? {
              name: entry.error.name,
              message: entry.error.message,
              stack: entry.error.stack,
            } : undefined,
          })),
        }),
      });
    } catch (error) {
      console.warn('Failed to send logs to remote:', error);
    }
  }

  private async log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ) {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context, error);

    // Log to console immediately
    await this.logToConsole(entry);

    // Log to Sentry for errors
    if (level === 'error') {
      await this.logToSentry(entry);
    }

    // Buffer for remote logging
    if (this.config.enableRemote) {
      this.buffer.push(entry);

      // Auto-flush if buffer is full
      if (this.buffer.length >= this.config.bufferSize) {
        await this.flush();
      }
    }
  }

  debug(message: string, context?: Record<string, any>) {
    return this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>) {
    return this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    return this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    return this.log('error', message, context, error);
  }

  async flush() {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    await this.logToRemote(entries);
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Global logger instance
const logger = new Logger({
  remoteUrl: process.env.NEXT_PUBLIC_LOGGING_URL || '/api/logs',
});

// React hook for logging with automatic cleanup
export function useLogger() {
  useEffect(() => {
    return () => {
      logger.flush();
    };
  }, []);

  const logError = useCallback((error: Error, context?: Record<string, any>) => {
    logger.error(error.message, error, context);
  }, []);

  const logInfo = useCallback((message: string, context?: Record<string, any>) => {
    logger.info(message, context);
  }, []);

  const logWarn = useCallback((message: string, context?: Record<string, any>) => {
    logger.warn(message, context);
  }, []);

  const logDebug = useCallback((message: string, context?: Record<string, any>) => {
    logger.debug(message, context);
  }, []);

  return {
    logError,
    logInfo,
    logWarn,
    logDebug,
    flush: () => logger.flush(),
  };
}

// Global error handler for unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error('Unhandled JavaScript error', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', event.reason, {
      promise: event.promise,
    });
  });
}

export { logger };
export default logger;