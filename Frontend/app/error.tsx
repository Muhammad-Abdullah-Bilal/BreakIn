"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from '@/providers/AuthProvider';
import { getHomeRoute } from '@/lib/roleRouting';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { user } = useAuth();
  
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <svg 
            className="w-8 h-8 text-destructive" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Something went wrong!
        </h1>
        
        <p className="text-muted-foreground mb-6">
          We apologize for the inconvenience. An error occurred while processing your request.
        </p>
        
        {error?.digest && (
          <p className="text-sm text-muted-foreground mb-4">
            Error ID: {error.digest}
          </p>
        )}
        
        <div className="space-y-3">
          <Button onClick={reset} className="w-full">
            Try again
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.href = getHomeRoute(user?.role)}
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Error Details (Development)
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-40">
              {error.message}
              {error.stack && '\n' + error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
