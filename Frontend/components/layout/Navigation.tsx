'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { getHomeRoute, getRoleLabel, normalizeRole } from '@/lib/roleRouting';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { Badge } from '@/components/ui/badge';
import { 
  Code2, 
  LayoutDashboard, 
  Users, 
  Award, 
  Briefcase, 
  Radar, 
  Bot, 
  BarChart3, 
  GraduationCap, 
  ShieldCheck, 
  Sliders, 
  Menu, 
  X,
  LogOut,
  User as UserIcon,
  MessageSquare
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export function Navigation() {
  const pathname = usePathname();
  const { user, isAuthenticated, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Don't show navigation on auth pages or root landing page if desired
  if (pathname?.startsWith('/auth/') || pathname === '/') {
    return null;
  }

  const role = normalizeRole(user?.role);
  const roleLabel = getRoleLabel(user?.role);

  // Dynamic role-specific navigation definitions
  const getNavItemsForRole = (): NavItem[] => {
    switch (role) {
      case 'developer':
        return [
          { href: '/developer-dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 mr-1.5" /> },
          { href: '/sprint', label: 'Sprints', icon: <Code2 className="w-4 h-4 mr-1.5" /> },
          { href: '/community', label: 'Community', icon: <MessageSquare className="w-4 h-4 mr-1.5" /> },
          { href: '/profile', label: 'Portfolio', icon: <Award className="w-4 h-4 mr-1.5" /> },
        ];
      case 'employer':
        return [
          { href: '/company-dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 mr-1.5" /> },
          { href: '/company-dashboard?tab=talent', label: 'Talent Radar', icon: <Radar className="w-4 h-4 mr-1.5" /> },
          { href: '/company-dashboard?tab=squads', label: 'Squad Hiring', icon: <Users className="w-4 h-4 mr-1.5" /> },
          { href: '/company-dashboard/ai-agents', label: 'AI Agents', icon: <Bot className="w-4 h-4 mr-1.5" /> },
          { href: '/company-dashboard/analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4 mr-1.5" /> },
        ];
      case 'mentor':
        return [
          { href: '/mentor', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 mr-1.5" /> },
          { href: '/mentor/queue', label: 'Review Queue', icon: <GraduationCap className="w-4 h-4 mr-1.5" /> },
          { href: '/mentor/review', label: 'Submission Review', icon: <ShieldCheck className="w-4 h-4 mr-1.5" /> },
          { href: '/mentor/calibration', label: 'Calibration', icon: <Sliders className="w-4 h-4 mr-1.5" /> },
          { href: '/community', label: 'Community', icon: <MessageSquare className="w-4 h-4 mr-1.5" /> },
        ];
      case 'admin':
        return [
          { href: '/admin', label: 'Admin Dashboard', icon: <ShieldCheck className="w-4 h-4 mr-1.5" /> },
          { href: '/admin?tab=moderation', label: 'Moderation', icon: <Sliders className="w-4 h-4 mr-1.5" /> },
          { href: '/admin?tab=flags', label: 'Feature Flags', icon: <Bot className="w-4 h-4 mr-1.5" /> },
          { href: '/admin?tab=logs', label: 'Audit Logs', icon: <BarChart3 className="w-4 h-4 mr-1.5" /> },
        ];
      default:
        return [
          { href: '/developer-dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 mr-1.5" /> },
        ];
    }
  };

  const navItems = getNavItemsForRole();

  const isActiveLink = (href: string) => {
    const baseHref = href.split('?')[0];
    if (pathname === baseHref) return true;
    if (baseHref !== '/' && pathname?.startsWith(baseHref)) return true;
    return false;
  };

  return (
    <nav className="bg-slate-950/90 border-b border-slate-800/80 sticky top-0 z-50 backdrop-blur-md text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center space-x-3">
            <Link 
              href={getHomeRoute(user?.role)} 
              className="flex items-center space-x-2 text-lg font-bold text-white hover:text-blue-400 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="tracking-tight">BreakIn</span>
            </Link>

            {/* Role Badge */}
            {isAuthenticated && (
              <Badge variant="outline" className="hidden sm:inline-flex bg-slate-900 border-slate-700 text-slate-300 text-[11px] font-medium py-0.5 px-2">
                {roleLabel}
              </Badge>
            )}
          </div>

          {/* Desktop navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center ${
                    isActiveLink(item.href)
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {/* Right side items */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && (
              <>
                {/* Notifications */}
                <NotificationBell />
                
                {/* User menu dropdown */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors">
                    <div className="w-8 h-8 bg-blue-600/20 border border-blue-500/30 rounded-full flex items-center justify-center text-blue-400 font-semibold text-xs">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.displayName || user.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        (user?.displayName || user?.username || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-200 hidden lg:inline max-w-[120px] truncate">
                      {user?.displayName || user?.username}
                    </span>
                  </button>
                  
                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-2 w-52 bg-slate-900 rounded-lg shadow-xl border border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-1">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-xs font-semibold text-slate-100 truncate">
                        {user?.displayName || user?.username}
                      </p>
                      <p className="text-[11px] text-blue-400 font-medium capitalize">
                        {roleLabel} Portal
                      </p>
                    </div>
                    
                    <Link
                      href={getHomeRoute(user?.role)}
                      className="flex items-center px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      My Dashboard
                    </Link>

                    <Link
                      href="/profile"
                      className="flex items-center px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors"
                    >
                      <UserIcon className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      Profile Settings
                    </Link>
                    
                    <div className="border-t border-slate-800 my-1" />

                    <button
                      onClick={signOut}
                      className="w-full flex items-center px-3 py-2 text-xs text-red-400 hover:bg-red-950/40 rounded-md transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-2 text-red-400" />
                      Sign Out
                    </button>
                  </div>
                </div>

                {/* Mobile menu toggle button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 text-slate-400 hover:text-white"
                  aria-label="Toggle navigation menu"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {isAuthenticated && isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-2 pb-4 space-y-1">
          <div className="px-2 py-1.5 mb-2 bg-slate-900/60 rounded border border-slate-800 text-xs flex justify-between items-center">
            <span className="text-slate-400">Current Role:</span>
            <span className="text-blue-400 font-semibold">{roleLabel}</span>
          </div>

          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActiveLink(item.href)
                  ? 'bg-blue-600/20 text-blue-400 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                signOut();
              }}
              className="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-red-950/40"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}