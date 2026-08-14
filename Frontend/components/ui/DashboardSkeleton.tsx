'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function StatCardSkeleton() {
  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24 bg-slate-800" />
        <Skeleton className="h-4 w-4 rounded-full bg-slate-800" />
      </CardHeader>
      <CardContent className="space-y-1.5">
        <Skeleton className="h-8 w-20 bg-slate-800" />
        <Skeleton className="h-3 w-32 bg-slate-800/60" />
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 4, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        {[...Array(cols)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-20 bg-slate-800" />
        ))}
      </div>
      {[...Array(rows)].map((_, r) => (
        <div key={r} className="flex items-center justify-between py-3 border-b border-slate-800/40">
          {[...Array(cols)].map((_, c) => (
            <Skeleton key={c} className="h-4 w-24 bg-slate-800/60" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="bg-slate-900/60 border-slate-800">
          <CardHeader className="space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-16 bg-slate-800" />
              <Skeleton className="h-4 w-12 bg-slate-800" />
            </div>
            <Skeleton className="h-6 w-3/4 bg-slate-800" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full bg-slate-800/60" />
            <Skeleton className="h-4 w-5/6 bg-slate-800/60" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-16 bg-slate-800" />
              <Skeleton className="h-6 w-16 bg-slate-800" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FullDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner Skeleton */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-slate-800" />
            <Skeleton className="h-4 w-96 bg-slate-800/60" />
          </div>
          <Skeleton className="h-10 w-36 bg-slate-800" />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Tabs Skeleton */}
      <div className="h-11 w-full bg-slate-900/80 border border-slate-800 rounded-lg p-1">
        <div className="grid grid-cols-4 gap-2 h-full">
          <Skeleton className="h-full bg-slate-800 rounded" />
          <Skeleton className="h-full bg-slate-800/40 rounded" />
          <Skeleton className="h-full bg-slate-800/40 rounded" />
          <Skeleton className="h-full bg-slate-800/40 rounded" />
        </div>
      </div>

      {/* Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/60 border-slate-800 p-6 space-y-4">
            <Skeleton className="h-6 w-48 bg-slate-800" />
            <Skeleton className="h-24 w-full bg-slate-800/40 rounded-lg" />
            <Skeleton className="h-24 w-full bg-slate-800/40 rounded-lg" />
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="bg-slate-900/60 border-slate-800 p-6 space-y-4">
            <Skeleton className="h-6 w-32 bg-slate-800" />
            <Skeleton className="h-16 w-full bg-slate-800/40 rounded-lg" />
            <Skeleton className="h-16 w-full bg-slate-800/40 rounded-lg" />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default FullDashboardSkeleton;
