'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { isRoleAllowed, PrimaryRole, UserRole } from '@/lib/roleRouting';
import { AccessDenied } from './AccessDenied';

interface RoleGuardProps {
  allowedRoles: (PrimaryRole | UserRole)[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const { user, isAuthenticated, isLoading, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthChecking = isLoading || loading;

  useEffect(() => {
    if (!isAuthChecking && !isAuthenticated) {
      const redirectUrl = pathname ? `/auth/sign-in?redirect=${encodeURIComponent(pathname)}` : '/auth/sign-in';
      router.push(redirectUrl);
    }
  }, [isAuthChecking, isAuthenticated, router, pathname]);

  if (isAuthChecking) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Verifying access permissions...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  const hasPermission = isRoleAllowed(user.role, allowedRoles);

  if (!hasPermission) {
    return fallback ? <>{fallback}</> : <AccessDenied requiredRole={allowedRoles} />;
  }

  return <>{children}</>;
}

export default RoleGuard;
