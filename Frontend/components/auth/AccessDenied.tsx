'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { getRoleDashboardRoute, getRoleLabel } from '@/lib/roleRouting';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AccessDeniedProps {
  requiredRole?: string | string[];
  message?: string;
}

export function AccessDenied({ requiredRole, message }: AccessDeniedProps) {
  const { user } = useAuth();
  const userDashboard = getRoleDashboardRoute(user?.role);
  const currentRoleLabel = getRoleLabel(user?.role);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      {/* Background glow accents */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="max-w-lg w-full bg-slate-900/90 border-slate-800 backdrop-blur-xl shadow-2xl relative z-10 text-white overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />
        
        <CardHeader className="text-center pb-2 pt-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-950/60 border border-red-800/60 flex items-center justify-center mb-4 text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge variant="outline" className="border-red-800 text-red-400 bg-red-950/40 text-xs px-2.5 py-0.5 font-mono">
              403 FORBIDDEN
            </Badge>
          </div>

          <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Access restricted
          </CardTitle>
          
          <CardDescription className="text-slate-400 text-sm mt-2">
            {message || "You don't have permission to access this area."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4 pb-6 text-sm text-slate-300">
          <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Signed in as:</span>
              <span className="font-semibold text-slate-200">{user?.displayName || user?.email || 'Authenticated User'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Your Current Role:</span>
              <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 text-[11px]">
                {currentRoleLabel}
              </Badge>
            </div>
            {requiredRole && (
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/60">
                <span className="text-slate-400">Required Role:</span>
                <span className="text-amber-400 font-medium">
                  {Array.isArray(requiredRole) ? requiredRole.map(getRoleLabel).join(' or ') : getRoleLabel(requiredRole)}
                </span>
              </div>
            )}
          </div>
          
          <p className="text-xs text-slate-400 text-center">
            This module is reserved for authorized accounts. If you believe this is a mistake, please reach out to your administrator.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2 pb-8 px-6">
          <Button
            asChild
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-600/20"
          >
            <Link href={userDashboard} className="flex items-center justify-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Return to Dashboard
            </Link>
          </Button>
          
          <Button
            variant="outline"
            asChild
            className="w-full border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300"
          >
            <Link href="/" className="flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Home Page
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default AccessDenied;
