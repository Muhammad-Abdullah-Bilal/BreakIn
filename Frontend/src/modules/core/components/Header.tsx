'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '../../../hooks/useTheme';

export const Header = () => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">BreakIn</span>
          </Link>
          
          <nav className="hidden md:flex gap-6">
            <Link 
              href="/developer-dashboard" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname?.startsWith('/developer-dashboard') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              href="/sprint" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname?.startsWith('/sprint') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Sprints
            </Link>
            <Link 
              href="/workspace" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname?.startsWith('/workspace') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Workspace
            </Link>
            <Link 
              href="/company" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname?.startsWith('/company') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Companies
            </Link>
            <Link 
              href="/mentor" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname?.startsWith('/mentor') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Mentors
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="rounded-full p-2 hover:bg-muted"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            )}
          </button>
          <Link 
            href="/auth/profile"
            className="flex items-center gap-2 rounded-full hover:bg-muted p-1"
          >
            <div className="relative h-8 w-8 rounded-full overflow-hidden">
              <img 
                src="/placeholder-user.jpg" 
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};
