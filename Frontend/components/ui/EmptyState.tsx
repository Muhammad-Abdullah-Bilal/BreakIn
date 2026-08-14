'use client';

import React from 'react';
import { LucideIcon, FolderSearch, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = FolderSearch,
  title,
  description,
  badge,
  actionLabel,
  actionHref,
  onAction,
  secondaryActionLabel,
  secondaryActionHref,
  onSecondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl bg-slate-900/40 border border-slate-800/80 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
        <Icon className="w-7 h-7" />
      </div>

      {badge && (
        <Badge variant="outline" className="mb-2 bg-slate-900 border-slate-700 text-slate-300 text-[11px]">
          {badge}
        </Badge>
      )}

      <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 tracking-tight">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionLabel && (
            actionHref ? (
              <Button asChild className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-blue-600/20">
                <Link href={actionHref}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  {actionLabel}
                </Link>
              </Button>
            ) : (
              <Button onClick={onAction} className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-blue-600/20">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                {actionLabel}
              </Button>
            )
          )}

          {secondaryActionLabel && (
            secondaryActionHref ? (
              <Button asChild variant="outline" className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs sm:text-sm">
                <Link href={secondaryActionHref}>
                  {secondaryActionLabel}
                </Link>
              </Button>
            ) : (
              <Button onClick={onSecondaryAction} variant="outline" className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs sm:text-sm">
                {secondaryActionLabel}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
