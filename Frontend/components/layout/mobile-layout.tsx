/**
 * Mobile-Optimized Layout Components
 * 
 * Responsive layout components with accessibility features
 * and mobile-first design patterns.
 */

import React, { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useAccessibility } from '@/lib/accessibility';

// Main layout container with safe area support
interface LayoutContainerProps {
  children: ReactNode;
  className?: string;
  useSafeArea?: boolean;
  enableScrollRestoration?: boolean;
}

export const LayoutContainer = forwardRef<HTMLDivElement, LayoutContainerProps>(
  ({ children, className, useSafeArea = true, enableScrollRestoration = true, ...props }, ref) => {
    const { announceToScreenReader } = useAccessibility();

    React.useEffect(() => {
      if (enableScrollRestoration && typeof window !== 'undefined') {
        // Restore scroll position on navigation
        const savedPosition = sessionStorage.getItem('scrollPosition');
        if (savedPosition) {
          window.scrollTo(0, parseInt(savedPosition, 10));
        }

        const handleScroll = () => {
          sessionStorage.setItem('scrollPosition', window.scrollY.toString());
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
      }
    }, [enableScrollRestoration]);

    return (
      <div
        ref={ref}
        className={cn(
          'min-h-screen bg-background text-foreground',
          'antialiased font-sans',
          useSafeArea && 'pt-safe-top pb-safe-bottom pl-safe-left pr-safe-right',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

LayoutContainer.displayName = 'LayoutContainer';

// Mobile-optimized header component
interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  backButton?: boolean;
  onBack?: () => void;
  className?: string;
}

export const MobileHeader = forwardRef<HTMLElement, MobileHeaderProps>(
  ({ title, subtitle, leftAction, rightAction, backButton, onBack, className, ...props }, ref) => {
    const { createAriaAttributes } = useAccessibility();

    return (
      <header
        ref={ref}
        className={cn(
          'sticky top-0 z-40 w-full',
          'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          'border-b border-border',
          'px-4 py-3 sm:px-6',
          className
        )}
        {...props}
        {...createAriaAttributes({
          role: 'banner',
          label: `Page header: ${title}`
        })}
      >
        <div className="flex items-center justify-between min-h-[44px]">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {backButton && (
              <button
                onClick={onBack}
                className={cn(
                  'btn-enhanced p-2 -ml-2',
                  'text-muted-foreground hover:text-foreground',
                  'focus-ring'
                )}
                {...createAriaAttributes({
                  label: 'Go back'
                })}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {leftAction}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-foreground truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {rightAction && (
            <div className="flex items-center gap-2 ml-2">
              {rightAction}
            </div>
          )}
        </div>
      </header>
    );
  }
);

MobileHeader.displayName = 'MobileHeader';

// Mobile navigation bar
interface MobileNavItem {
  id: string;
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: number;
  isActive?: boolean;
}

interface MobileNavProps {
  items: MobileNavItem[];
  className?: string;
}

export const MobileNav = forwardRef<HTMLElement, MobileNavProps>(
  ({ items, className, ...props }, ref) => {
    const { createAriaAttributes } = useAccessibility();

    return (
      <nav
        ref={ref}
        className={cn('nav-mobile', className)}
        {...props}
        {...createAriaAttributes({
          role: 'navigation',
          label: 'Main navigation'
        })}
      >
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={cn(
              'nav-mobile-item',
              item.isActive && 'active'
            )}
            {...createAriaAttributes({
              label: item.label,
              current: item.isActive ? 'page' : undefined
            })}
          >
            <div className="relative">
              {item.icon}
              {item.badge && item.badge > 0 && (
                <span
                  className={cn(
                    'absolute -top-1 -right-1',
                    'bg-destructive text-destructive-foreground',
                    'text-xs font-medium',
                    'min-w-[16px] h-4 px-1',
                    'rounded-full flex items-center justify-center'
                  )}
                  {...createAriaAttributes({
                    label: `${item.badge} notifications`
                  })}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-xs mt-1 truncate max-w-[60px]">
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    );
  }
);

MobileNav.displayName = 'MobileNav';

// Responsive grid container
interface ResponsiveGridProps {
  children: ReactNode;
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export const ResponsiveGrid = forwardRef<HTMLDivElement, ResponsiveGridProps>(
  ({ children, columns = { default: 1, sm: 2, lg: 3, xl: 4 }, gap = 4, className, ...props }, ref) => {
    const gridClasses = [
      `grid gap-${gap}`,
      columns.default && `grid-cols-${columns.default}`,
      columns.sm && `sm:grid-cols-${columns.sm}`,
      columns.md && `md:grid-cols-${columns.md}`,
      columns.lg && `lg:grid-cols-${columns.lg}`,
      columns.xl && `xl:grid-cols-${columns.xl}`,
    ].filter(Boolean).join(' ');

    return (
      <div
        ref={ref}
        className={cn(gridClasses, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ResponsiveGrid.displayName = 'ResponsiveGrid';

// Mobile-optimized modal
interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showCloseButton?: boolean;
  className?: string;
}

export const MobileModal = forwardRef<HTMLDivElement, MobileModalProps>(
  ({ isOpen, onClose, title, children, size = 'md', showCloseButton = true, className, ...props }, ref) => {
    const { createAriaAttributes, trapFocus, manageFocus } = useAccessibility();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    React.useEffect(() => {
      if (!mounted) return;

      if (isOpen) {
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus management
        const restore = manageFocus();
        
        return () => {
          document.body.style.overflow = '';
          restore();
        };
      }
    }, [isOpen, mounted, manageFocus]);

    if (!mounted || !isOpen) return null;

    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      full: 'max-w-full'
    };

    return (
      <div className="modal-mobile">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          {...createAriaAttributes({
            label: 'Close modal'
          })}
        />
        
        {/* Modal content */}
        <div
          ref={ref}
          className={cn(
            'modal-content-mobile',
            sizeClasses[size],
            className
          )}
          {...props}
          {...createAriaAttributes({
            role: 'dialog',
            modal: true,
            labelledby: 'modal-title'
          })}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2
              id="modal-title"
              className="text-lg font-semibold text-foreground"
            >
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  'btn-enhanced p-2 -mr-2',
                  'text-muted-foreground hover:text-foreground',
                  'focus-ring'
                )}
                {...createAriaAttributes({
                  label: 'Close modal'
                })}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Body */}
          <div className="p-4 flex-1 overflow-y-auto scroll-safe">
            {children}
          </div>
        </div>
      </div>
    );
  }
);

MobileModal.displayName = 'MobileModal';

// Touch-friendly list component
interface TouchListItem {
  id: string;
  content: ReactNode;
  onClick?: () => void;
  rightAction?: ReactNode;
  leftIcon?: ReactNode;
  disabled?: boolean;
}

interface TouchListProps {
  items: TouchListItem[];
  divided?: boolean;
  className?: string;
}

export const TouchList = forwardRef<HTMLDivElement, TouchListProps>(
  ({ items, divided = true, className, ...props }, ref) => {
    const { createAriaAttributes } = useAccessibility();

    return (
      <div
        ref={ref}
        className={cn(
          'space-y-0',
          divided && 'divide-y divide-border',
          className
        )}
        {...props}
        {...createAriaAttributes({
          role: 'list'
        })}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-3 p-4',
              'min-h-[60px]',
              'transition-colors duration-200',
              item.onClick && !item.disabled && [
                'cursor-pointer hover:bg-muted/50',
                'focus:outline-none focus:bg-muted/50',
                'active:bg-muted'
              ],
              item.disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={item.disabled ? undefined : item.onClick}
            tabIndex={item.onClick && !item.disabled ? 0 : undefined}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && item.onClick && !item.disabled) {
                e.preventDefault();
                item.onClick();
              }
            }}
            {...createAriaAttributes({
              role: item.onClick ? 'button' : 'listitem',
              disabled: item.disabled
            })}
          >
            {item.leftIcon && (
              <div className="flex-shrink-0 text-muted-foreground">
                {item.leftIcon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {item.content}
            </div>
            {item.rightAction && (
              <div className="flex-shrink-0">
                {item.rightAction}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
);

TouchList.displayName = 'TouchList';

// Pull-to-refresh container
interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
  threshold?: number;
  className?: string;
}

export const PullToRefresh = forwardRef<HTMLDivElement, PullToRefreshProps>(
  ({ children, onRefresh, isRefreshing = false, threshold = 60, className, ...props }, ref) => {
    const [pullDistance, setPullDistance] = React.useState(0);
    const [isPulling, setIsPulling] = React.useState(false);
    const startY = React.useRef(0);
    const currentY = React.useRef(0);

    const handleTouchStart = (e: React.TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isPulling) return;

      currentY.current = e.touches[0].clientY;
      const distance = Math.max(0, currentY.current - startY.current);
      
      if (distance > 0 && window.scrollY === 0) {
        e.preventDefault();
        setPullDistance(Math.min(distance, threshold * 1.5));
      }
    };

    const handleTouchEnd = async () => {
      if (isPulling && pullDistance >= threshold && !isRefreshing) {
        await onRefresh();
      }
      
      setIsPulling(false);
      setPullDistance(0);
    };

    const pullProgress = Math.min(pullDistance / threshold, 1);
    const shouldTrigger = pullProgress >= 1;

    return (
      <div
        ref={ref}
        className={cn('pull-to-refresh', className)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        {/* Pull indicator */}
        {(isPulling || isRefreshing) && (
          <div
            className={cn(
              'flex items-center justify-center py-4',
              'text-muted-foreground transition-all duration-200'
            )}
            style={{
              transform: `translateY(${Math.max(0, pullDistance - 20)}px)`,
              opacity: Math.max(0.3, pullProgress)
            }}
          >
            {isRefreshing ? (
              <div className="loading-spinner" />
            ) : (
              <div
                className={cn(
                  'transition-transform duration-200',
                  shouldTrigger && 'rotate-180'
                )}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            )}
          </div>
        )}
        
        {children}
      </div>
    );
  }
);

PullToRefresh.displayName = 'PullToRefresh';

export default {
  LayoutContainer,
  MobileHeader,
  MobileNav,
  ResponsiveGrid,
  MobileModal,
  TouchList,
  PullToRefresh,
};