'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { getHomeRoute } from '@/lib/roleRouting';

export default function NotFound() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <svg 
            className="w-8 h-8 text-primary" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        </div>
        
        <h1 className="text-4xl font-bold text-foreground mb-2">
          404
        </h1>
        
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Page Not Found
        </h2>
        
        <p className="text-muted-foreground mb-6">
          Sorry, we couldn't find the page you're looking for. The page might have been moved or deleted.
        </p>
        
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href={getHomeRoute(user?.role)}>
              Go to Dashboard
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/">
              Back to Home
            </Link>
          </Button>
        </div>
        
        <div className="mt-8 text-sm text-muted-foreground">
          <p>
            Need help? <Link href="/support" className="text-primary hover:underline">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
