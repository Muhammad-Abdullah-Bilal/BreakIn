'use client';

import React from 'react';
import { Footer } from './Footer';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

type MainLayoutProps = {
  children: React.ReactNode;
  showSidebar?: boolean;
  variant?: 'developer' | 'company' | 'mentor';
  showHeader?: boolean;
  showFooter?: boolean;
};

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  showSidebar = false,
  variant = 'developer',
  showHeader = true,
  showFooter = true,
}) => {
  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header />}
      
      <div className="flex-1 flex">
        {showSidebar && (
          <aside className="hidden md:block w-64 shrink-0">
            <Sidebar variant={variant} />
          </aside>
        )}
        
        <main className="flex-1">
          <div className="container py-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
      
      {showFooter && <Footer />}
    </div>
  );
};
