'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Session shape as per frozen contracts
export interface User {
  id: string;
  role: 'junior' | 'mentor' | 'recruiter' | 'admin';
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    emailUpdates: boolean;
  };
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
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });
  
  const router = useRouter();

  // Mock authentication for development
  useEffect(() => {
    // Simulate loading session
    setTimeout(() => {
      setState({
        session: null,
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }, 1000);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Mock sign in
    setTimeout(() => {
      const mockUser: User = {
        id: 'user-123',
        role: 'junior',
        email,
        username: email.split('@')[0],
        displayName: 'Test User',
      };
      
      const mockSession: Session = {
        user: mockUser,
        token: 'mock-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      
      setState({
        session: mockSession,
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
      });

      // Redirect to intended page or dashboard after successful login
      const returnUrl = sessionStorage.getItem('returnUrl') || '/';
      sessionStorage.removeItem('returnUrl');
      router.push(returnUrl);
    }, 1000);
  }, []);

  const signOut = useCallback(async () => {
    setState({
      session: null,
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
    router.push('/auth/signin');
  }, [router]);

  const signUp = useCallback(async (email: string, password: string, userData: Partial<User>) => {
    // Mock implementation
    await signIn(email, password);
  }, [signIn]);

  const refreshSession = useCallback(async () => {
    // Mock implementation
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!state.user) return;
    
    const updatedUser = { ...state.user, ...updates };
    setState(prev => ({
      ...prev,
      user: updatedUser,
      session: prev.session ? { ...prev.session, user: updatedUser } : null,
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
