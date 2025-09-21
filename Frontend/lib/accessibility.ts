/**
 * Accessibility Utilities
 * 
 * Comprehensive utilities for ensuring accessibility compliance across all components.
 * Implements WCAG 2.1 AA standards with enhanced mobile support.
 */

import { useEffect, useRef, useState } from 'react';

// ARIA Attributes Helper
export const aria = {
  // Labeling
  label: (text: string) => ({ 'aria-label': text }),
  labelledBy: (id: string) => ({ 'aria-labelledby': id }),
  describedBy: (id: string) => ({ 'aria-describedby': id }),
  
  // States
  expanded: (isExpanded: boolean) => ({ 'aria-expanded': isExpanded }),
  selected: (isSelected: boolean) => ({ 'aria-selected': isSelected }),
  checked: (isChecked: boolean | 'mixed') => ({ 'aria-checked': isChecked }),
  pressed: (isPressed: boolean) => ({ 'aria-pressed': isPressed }),
  hidden: (isHidden: boolean) => ({ 'aria-hidden': isHidden }),
  disabled: (isDisabled: boolean) => ({ 'aria-disabled': isDisabled }),
  
  // Properties
  current: (current: boolean | 'page' | 'step' | 'location' | 'date' | 'time') => 
    ({ 'aria-current': current }),
  level: (level: number) => ({ 'aria-level': level }),
  setSize: (size: number) => ({ 'aria-setsize': size }),
  posInSet: (position: number) => ({ 'aria-posinset': position }),
  
  // Live regions
  live: (politeness: 'polite' | 'assertive' | 'off') => ({ 'aria-live': politeness }),
  atomic: (isAtomic: boolean) => ({ 'aria-atomic': isAtomic }),
  relevant: (relevant: string) => ({ 'aria-relevant': relevant }),
  
  // Relationships
  owns: (ids: string) => ({ 'aria-owns': ids }),
  controls: (id: string) => ({ 'aria-controls': id }),
  flowTo: (id: string) => ({ 'aria-flowto': id }),
  
  // Roles
  role: (role: string) => ({ role }),
} as const;

// Keyboard Navigation Hook
export function useKeyboardNavigation(
  items: Array<{ id: string; disabled?: boolean }>,
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    wrap?: boolean;
    activateOnFocus?: boolean;
    onActivate?: (id: string) => void;
  } = {}
) {
  const {
    orientation = 'vertical',
    wrap = true,
    activateOnFocus = false,
    onActivate
  } = options;

  const [focusedIndex, setFocusedIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);

  const getNextIndex = (currentIndex: number, direction: 'next' | 'prev'): number => {
    const enabledItems = items.filter(item => !item.disabled);
    if (enabledItems.length === 0) return -1;

    const currentEnabledIndex = enabledItems.findIndex(
      item => item.id === items[currentIndex]?.id
    );

    let nextEnabledIndex: number;
    if (direction === 'next') {
      nextEnabledIndex = currentEnabledIndex + 1;
      if (nextEnabledIndex >= enabledItems.length) {
        nextEnabledIndex = wrap ? 0 : currentEnabledIndex;
      }
    } else {
      nextEnabledIndex = currentEnabledIndex - 1;
      if (nextEnabledIndex < 0) {
        nextEnabledIndex = wrap ? enabledItems.length - 1 : currentEnabledIndex;
      }
    }

    return items.findIndex(item => item.id === enabledItems[nextEnabledIndex]?.id);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const { key } = event;
    let handled = false;

    switch (key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          const nextIndex = getNextIndex(focusedIndex, 'next');
          if (nextIndex !== -1) {
            setFocusedIndex(nextIndex);
            if (activateOnFocus) {
              setActiveIndex(nextIndex);
              onActivate?.(items[nextIndex].id);
            }
          }
          handled = true;
        }
        break;

      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          const prevIndex = getNextIndex(focusedIndex, 'prev');
          if (prevIndex !== -1) {
            setFocusedIndex(prevIndex);
            if (activateOnFocus) {
              setActiveIndex(prevIndex);
              onActivate?.(items[prevIndex].id);
            }
          }
          handled = true;
        }
        break;

      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          const nextIndex = getNextIndex(focusedIndex, 'next');
          if (nextIndex !== -1) {
            setFocusedIndex(nextIndex);
            if (activateOnFocus) {
              setActiveIndex(nextIndex);
              onActivate?.(items[nextIndex].id);
            }
          }
          handled = true;
        }
        break;

      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          const prevIndex = getNextIndex(focusedIndex, 'prev');
          if (prevIndex !== -1) {
            setFocusedIndex(prevIndex);
            if (activateOnFocus) {
              setActiveIndex(prevIndex);
              onActivate?.(items[prevIndex].id);
            }
          }
          handled = true;
        }
        break;

      case 'Home':
        event.preventDefault();
        const firstEnabledIndex = items.findIndex(item => !item.disabled);
        if (firstEnabledIndex !== -1) {
          setFocusedIndex(firstEnabledIndex);
          if (activateOnFocus) {
            setActiveIndex(firstEnabledIndex);
            onActivate?.(items[firstEnabledIndex].id);
          }
        }
        handled = true;
        break;

      case 'End':
        event.preventDefault();
        const lastEnabledIndex = items.findLastIndex(item => !item.disabled);
        if (lastEnabledIndex !== -1) {
          setFocusedIndex(lastEnabledIndex);
          if (activateOnFocus) {
            setActiveIndex(lastEnabledIndex);
            onActivate?.(items[lastEnabledIndex].id);
          }
        }
        handled = true;
        break;

      case 'Enter':
      case ' ':
        if (!activateOnFocus) {
          event.preventDefault();
          setActiveIndex(focusedIndex);
          onActivate?.(items[focusedIndex].id);
          handled = true;
        }
        break;
    }

    return handled;
  };

  return {
    focusedIndex,
    activeIndex,
    setFocusedIndex,
    setActiveIndex,
    handleKeyDown,
    getItemProps: (index: number) => ({
      tabIndex: index === focusedIndex ? 0 : -1,
      'aria-selected': activeIndex === index,
      onFocus: () => setFocusedIndex(index),
    }),
  };
}

// Focus Management Hook
export function useFocusManagement() {
  const focusedElementRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = () => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  };

  const restoreFocus = () => {
    if (previousFocusRef.current && previousFocusRef.current.focus) {
      previousFocusRef.current.focus();
    }
  };

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstFocusable?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  };

  return {
    saveFocus,
    restoreFocus,
    trapFocus,
    setFocusedElement: (element: HTMLElement) => {
      focusedElementRef.current = element;
    },
  };
}

// Live Region Hook for Screen Readers
export function useLiveRegion() {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create live region if it doesn't exist
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }

    return () => {
      if (liveRegionRef.current && document.body.contains(liveRegionRef.current)) {
        document.body.removeChild(liveRegionRef.current);
      }
    };
  }, []);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 1000);
    }
  };

  return { announce };
}

// Mobile Touch Support Hook
export function useMobileTouch(
  element: React.RefObject<HTMLElement>,
  options: {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    threshold?: number;
  } = {}
) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50
  } = options;

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const currentElement = element.current;
    if (!currentElement) return;

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY
      };
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > threshold || absDeltaY > threshold) {
        if (absDeltaX > absDeltaY) {
          // Horizontal swipe
          if (deltaX > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
      }

      touchStartRef.current = null;
    };

    currentElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    currentElement.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      currentElement.removeEventListener('touchstart', handleTouchStart);
      currentElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [element, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);
}

// Reduced Motion Detection
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// High Contrast Detection
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersHighContrast;
}

// Responsive Breakpoint Hook
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
  };
}

// Skip Link Component
export function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
    >
      {children}
    </a>
  );
}

// Screen Reader Only Text
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

// Focus Visible Indicator
export function FocusRing({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 rounded ${className}`}>
      {children}
    </div>
  );
}

// Accessible Button Helper
export function createAccessibleButton(
  props: {
    onClick?: () => void;
    disabled?: boolean;
    'aria-label'?: string;
    'aria-describedby'?: string;
    type?: 'button' | 'submit' | 'reset';
  }
) {
  return {
    type: props.type || 'button',
    disabled: props.disabled || false,
    'aria-disabled': props.disabled || false,
    'aria-label': props['aria-label'],
    'aria-describedby': props['aria-describedby'],
    onClick: props.disabled ? undefined : props.onClick,
    onKeyDown: (event: React.KeyboardEvent) => {
      if ((event.key === 'Enter' || event.key === ' ') && !props.disabled) {
        event.preventDefault();
        props.onClick?.();
      }
    },
  };
}

// Color Contrast Utilities
export const colorContrast = {
  // WCAG AA compliant color combinations
  text: {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-700 dark:text-gray-300',
    muted: 'text-gray-500 dark:text-gray-400',
    inverse: 'text-white dark:text-gray-900',
  },
  background: {
    primary: 'bg-white dark:bg-gray-900',
    secondary: 'bg-gray-50 dark:bg-gray-800',
    muted: 'bg-gray-100 dark:bg-gray-700',
    inverse: 'bg-gray-900 dark:bg-white',
  },
  border: {
    default: 'border-gray-200 dark:border-gray-700',
    muted: 'border-gray-100 dark:border-gray-800',
    strong: 'border-gray-300 dark:border-gray-600',
  },
} as const;

// Mobile-Specific Utilities
export const mobile = {
  // Touch target size (minimum 44px)
  touchTarget: 'min-h-[44px] min-w-[44px]',
  
  // Safe area for devices with notches
  safeArea: {
    top: 'pt-safe-top',
    bottom: 'pb-safe-bottom',
    left: 'pl-safe-left',
    right: 'pr-safe-right',
  },
  
  // Responsive spacing
  spacing: {
    xs: 'p-2 sm:p-3',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  },
  
  // Responsive text
  text: {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
  },
} as const;

// Accessibility Testing Utilities (Development Only)
export const a11yTest = {
  // Log accessibility violations (use in development)
  logViolations: (element: HTMLElement) => {
    if (process.env.NODE_ENV === 'development') {
      // This would integrate with axe-core or similar testing library
      console.log('Accessibility check for:', element);
    }
  },
  
  // Validate ARIA attributes
  validateARIA: (element: HTMLElement) => {
    if (process.env.NODE_ENV === 'development') {
      const ariaAttributes = Array.from(element.attributes).filter(
        attr => attr.name.startsWith('aria-')
      );
      console.log('ARIA attributes:', ariaAttributes);
    }
  },
};