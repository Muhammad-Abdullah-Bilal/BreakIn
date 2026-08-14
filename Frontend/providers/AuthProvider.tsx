'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getRoleDashboardRoute, UserRole, normalizeRole } from '@/lib/roleRouting';

export interface User {
  id: string;
  role: UserRole | string;
  email: string;
  username: string;
  displayName?: string;
  pseudonym?: string;
  avatar?: string;
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    emailUpdates: boolean;
  };
}

export interface DeveloperProfile {
  id: string;
  codename: string;
  level: string;
  status: string;
  reputation: number;
  sprint_history: number;
  success_rate: number;
  total_earnings: string;
  skill_badges: number;
  mentor_endorsements: number;
  current_streak: number;
  team_rating: number;
  last_sprint?: string;
  avatar_url?: string;
}

export interface Session {
  user: User;
  token: string;
  expiresAt: string;
  refreshToken?: string;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  developer: DeveloperProfile | null;
  isLoading: boolean;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, userData?: Partial<User>) => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    developer: null,
    isLoading: true,
    loading: true,
    isAuthenticated: false,
  });

  const router = useRouter();

  // Restore saved session if exists, otherwise stay unauthenticated
  useEffect(() => {
    try {
      const stored = localStorage.getItem('breakin_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.user) {
          setState({
            session: {
              user: parsed.user,
              token: parsed.token || 'jwt_stored_session',
              expiresAt: new Date(Date.now() + 86400000).toISOString(),
            },
            user: parsed.user,
            developer: parsed.developer || null,
            isAuthenticated: true,
            isLoading: false,
            loading: false,
          });
          return;
        }
      }
    } catch {}

    setState(prev => ({
      ...prev,
      session: null,
      user: null,
      developer: null,
      isAuthenticated: false,
      isLoading: false,
      loading: false,
    }));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, loading: true }));
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please check your email and password.');
      }

      const loggedUser: User = data.user;
      const developerProfile: DeveloperProfile = data.developer;
      const session: Session = {
        user: loggedUser,
        token: data.token || `jwt_${Date.now()}`,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };

      const nextState = {
        session,
        user: loggedUser,
        developer: developerProfile,
        isLoading: false,
        loading: false,
        isAuthenticated: true,
      };

      setState(nextState);
      try {
        localStorage.setItem('breakin_user', JSON.stringify({
          user: loggedUser,
          developer: developerProfile,
          token: session.token,
        }));
      } catch {}

      const targetRoute = getRoleDashboardRoute(loggedUser.role);
      router.push(targetRoute);
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, loading: false }));
      throw err;
    }
  }, [router]);

  const signUp = useCallback(async (email: string, password: string, userData?: Partial<User>) => {
    setState(prev => ({ ...prev, isLoading: true, loading: true }));

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          displayName: userData?.displayName,
          username: userData?.username,
          role: userData?.role || 'developer',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Registration failed.');
      }

      // Auto sign-in or prepare for sign-in
      const loggedUser: User = data.user;
      const developerProfile: DeveloperProfile = data.developer;
      const session: Session = {
        user: loggedUser,
        token: `jwt_${Date.now()}`,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };

      const nextState = {
        session,
        user: loggedUser,
        developer: developerProfile,
        isLoading: false,
        loading: false,
        isAuthenticated: true,
      };

      setState(nextState);
      try {
        localStorage.setItem('breakin_user', JSON.stringify({
          user: loggedUser,
          developer: developerProfile,
          token: session.token,
        }));
      } catch {}

      const targetRoute = getRoleDashboardRoute(loggedUser.role);
      router.push(targetRoute);
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, loading: false }));
      throw err;
    }
  }, [router]);

  const signOut = useCallback(async () => {
    try {
      localStorage.removeItem('breakin_user');
    } catch {}
    setState({
      session: null,
      user: null,
      developer: null,
      isLoading: false,
      loading: false,
      isAuthenticated: false,
    });
    router.push('/auth/sign-in');
  }, [router]);

  const refreshSession = useCallback(async () => {}, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!state.user) return;
    const updated = { ...state.user, ...updates };
    setState(prev => ({
      ...prev,
      user: updated,
      session: prev.session ? { ...prev.session, user: updated } : null,
    }));
  }, [state.user]);

  const value: AuthContextType = {
    ...state,
    signIn,
    signOut,
    signUp,
    refreshSession,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
