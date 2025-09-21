'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  systemTheme: 'dark' | 'light';
  resolvedTheme: 'dark' | 'light';
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  systemTheme: 'light',
  resolvedTheme: 'light',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  attribute = 'class',
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>('light');
  const [mounted, setMounted] = useState(false);

  // Get system theme preference
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(media.matches ? 'dark' : 'light');

    const listener = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // Load theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme;
    if (stored && (stored === 'dark' || stored === 'light' || stored === 'system')) {
      setTheme(stored);
    }
    setMounted(true);
  }, []);

  // Calculate resolved theme
  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Temporarily disable transitions if requested
    if (disableTransitionOnChange) {
      root.style.setProperty('--duration-fast', '0ms');
      root.style.setProperty('--duration-normal', '0ms');
      root.style.setProperty('--duration-slow', '0ms');
    }

    if (attribute === 'class') {
      root.classList.remove('light', 'dark');
      root.classList.add(resolvedTheme);
    } else {
      root.setAttribute(attribute, resolvedTheme);
    }

    // Re-enable transitions
    if (disableTransitionOnChange) {
      setTimeout(() => {
        root.style.removeProperty('--duration-fast');
        root.style.removeProperty('--duration-normal');
        root.style.removeProperty('--duration-slow');
      }, 100);
    }
  }, [resolvedTheme, mounted, attribute, disableTransitionOnChange]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const value = {
    theme,
    setTheme: handleSetTheme,
    systemTheme,
    resolvedTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
