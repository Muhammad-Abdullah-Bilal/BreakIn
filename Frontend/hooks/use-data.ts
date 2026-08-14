// hooks/use-data.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { Developer, Sprint, Activity, SkillProgress } from '@/lib/models/types'

// Global in-memory cache and in-flight request deduplication map
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const memoryCache = new Map<string, CacheEntry<any>>()
const inFlightRequests = new Map<string, Promise<any>>()
const CACHE_TTL_MS = 30000 // 30 seconds stale-time

async function cachedFetch<T>(url: string, signal?: AbortSignal, forceRefresh = false): Promise<T> {
  const now = Date.now()
  const cached = memoryCache.get(url)

  if (!forceRefresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T
  }

  // Deduplicate identical in-flight requests
  if (inFlightRequests.has(url) && !forceRefresh) {
    return inFlightRequests.get(url) as Promise<T>
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(url, {
        signal,
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch data (${response.status})`)
      }

      const data = await response.json()
      memoryCache.set(url, { data, timestamp: Date.now() })
      return data as T
    } finally {
      inFlightRequests.delete(url)
    }
  })()

  inFlightRequests.set(url, fetchPromise)
  return fetchPromise
}

export function useDeveloper(userId: string | undefined | null) {
  const [developer, setDeveloper] = useState<Developer | null>(() => {
    if (!userId) return null
    const cached = memoryCache.get(`/api/developers/${userId}`)
    return cached ? (cached.data as Developer) : null
  })
  const [loading, setLoading] = useState(!developer && !!userId)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const fetchDeveloper = useCallback(async (force = false) => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await cachedFetch<Developer>(`/api/developers/${userId}`, undefined, force)
      if (mountedRef.current) {
        setDeveloper(data)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [userId])

  useEffect(() => {
    mountedRef.current = true
    const controller = new AbortController()
    fetchDeveloper()

    return () => {
      mountedRef.current = false
      controller.abort()
    }
  }, [fetchDeveloper])

  return { developer, loading, error, refetch: () => fetchDeveloper(true) }
}

export function useAvailableSprints() {
  const url = '/api/sprints/available'
  const [sprints, setSprints] = useState<Sprint[]>(() => {
    const cached = memoryCache.get(url)
    return cached ? (cached.data as Sprint[]) : []
  })
  const [loading, setLoading] = useState(sprints.length === 0)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const fetchSprints = useCallback(async (force = false) => {
    try {
      setLoading(true)
      setError(null)
      const data = await cachedFetch<Sprint[]>(url, undefined, force)
      if (mountedRef.current) {
        setSprints(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sprints')
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    fetchSprints()

    return () => {
      mountedRef.current = false
    }
  }, [fetchSprints])

  return { sprints, loading, error, refetch: () => fetchSprints(true) }
}

export function useActivities(userId: string | undefined | null) {
  const url = userId ? `/api/activities?user_id=${userId}` : ''
  const [activities, setActivities] = useState<Activity[]>(() => {
    if (!url) return []
    const cached = memoryCache.get(url)
    return cached ? (cached.data as Activity[]) : []
  })
  const [loading, setLoading] = useState(activities.length === 0 && !!userId)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const fetchActivities = useCallback(async (force = false) => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await cachedFetch<Activity[]>(url, undefined, force)
      if (mountedRef.current) {
        setActivities(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch activities')
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [userId, url])

  useEffect(() => {
    mountedRef.current = true
    fetchActivities()

    return () => {
      mountedRef.current = false
    }
  }, [fetchActivities])

  return { activities, loading, error, refetch: () => fetchActivities(true) }
}

export function useSkillProgress(userId: string | undefined | null) {
  const url = userId ? `/api/skills?user_id=${userId}` : ''
  const [skills, setSkills] = useState<SkillProgress[]>(() => {
    if (!url) return []
    const cached = memoryCache.get(url)
    return cached ? (cached.data as SkillProgress[]) : []
  })
  const [loading, setLoading] = useState(skills.length === 0 && !!userId)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const fetchSkills = useCallback(async (force = false) => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await cachedFetch<SkillProgress[]>(url, undefined, force)
      if (mountedRef.current) {
        setSkills(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch skills')
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [userId, url])

  useEffect(() => {
    mountedRef.current = true
    fetchSkills()

    return () => {
      mountedRef.current = false
    }
  }, [fetchSkills])

  return { skills, loading, error, refetch: () => fetchSkills(true) }
}

export function useDevelopers() {
  const url = '/api/developers'
  const [developers, setDevelopers] = useState<Developer[]>(() => {
    const cached = memoryCache.get(url)
    return cached ? (cached.data as Developer[]) : []
  })
  const [loading, setLoading] = useState(developers.length === 0)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const fetchDevelopers = useCallback(async (force = false) => {
    try {
      setLoading(true)
      setError(null)
      const data = await cachedFetch<Developer[]>(url, undefined, force)
      if (mountedRef.current) {
        setDevelopers(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch developers')
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    fetchDevelopers()

    return () => {
      mountedRef.current = false
    }
  }, [fetchDevelopers])

  return { developers, loading, error, refetch: () => fetchDevelopers(true) }
}