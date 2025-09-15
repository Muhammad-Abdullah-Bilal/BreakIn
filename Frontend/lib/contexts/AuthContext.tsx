// lib/contexts/AuthContext.tsx - Mongo-only auth
'use client'

import { loginUser, signupUser, type UserResponse } from '@/lib/api'
import { Developer } from '@/lib/models/types'
import { createContext, useContext, useEffect, useState } from 'react'

type AuthUser = UserResponse | null

interface AuthContextType {
  user: AuthUser
  token: string | null
  developer: Developer | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (username: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  syncUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'breakin_auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null)
  const [token, setToken] = useState<string | null>(null)
  const [developer, setDeveloper] = useState<Developer | null>(null)
  const [loading, setLoading] = useState(true)

  // Load persisted session
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
      if (raw) {
        const parsed = JSON.parse(raw) as { user: AuthUser; token: string }
        setUser(parsed.user)
        setToken(parsed.token)
        // Try to fetch developer using pseudonym as stable id for now
        if (parsed.user?.pseudonym) {
          // We don't have a direct mapping; attempt developer sync by email/pseudonym
          syncUserProfile(parsed.user)
        }
      }
    } catch {}
    setLoading(false)
  }, [])

  const persist = (u: AuthUser, t: string | null) => {
    setUser(u)
    setToken(t)
    if (typeof window !== 'undefined') {
      if (u && t) localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u, token: t }))
      else localStorage.removeItem(STORAGE_KEY)
    }
  }

  // Sync user profile with MongoDB via Next API (no Supabase)
  const syncUserProfile = async (userOverride?: AuthUser) => {
    const target = userOverride ?? user
    if (!target) return
    try {
      const res = await fetch('/api/auth/sync-user', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setDeveloper(data.developer)
      }
    } catch (e) {
      console.error('syncUserProfile failed', e)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { user: u, token: t } = await loginUser(email, password)
      persist(u, t)
      // On first sign-in, try ensure developer exists
      await syncUserProfile(u)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (username: string, email: string, password: string) => {
    setLoading(true)
    try {
      const u = await signupUser({ username, email, password })
      // Optional: auto sign-in after signup requires backend token issuance; skip for now
      persist(u, null)
      await syncUserProfile(u)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    persist(null, null)
    setDeveloper(null)
  }

  const value = { user, token, developer, loading, signIn, signUp, signOut, syncUserProfile }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}