// ===== FILE: lib/api-proxy.ts =====
import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ProxyOptions {
  endpoint: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  preserveQuery?: boolean
  transformBody?: (body: any) => any
}

export async function proxyToBackend(
  request: NextRequest,
  options: ProxyOptions
): Promise<NextResponse> {
  try {
    const { endpoint, method = 'GET', preserveQuery = true, transformBody } = options
    
    // Build the backend URL
    const backendUrl = new URL(endpoint, API_BASE_URL)
    
    // Preserve query parameters if requested
    if (preserveQuery) {
      const requestUrl = new URL(request.url)
      requestUrl.searchParams.forEach((value, key) => {
        backendUrl.searchParams.set(key, value)
      })
    }
    
    // Prepare headers and forward authorization if present
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      headers['Authorization'] = authHeader
    }
    
    // Prepare request options
    const requestOptions: RequestInit = {
      method: method,
      headers: headers,
    }
    
    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        let body = await request.json()
        if (transformBody) {
          body = transformBody(body)
        }
        requestOptions.body = JSON.stringify(body)
      } catch {
        // No json body provided
      }
    }
    
    const response = await fetch(backendUrl.toString(), requestOptions)
    
    if (!response.ok) {
      let errorMessage = `Backend API error: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData?.detail) errorMessage = errorData.detail
      } catch {}
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal proxy communication error'
    return NextResponse.json(
      { error: `Failed to proxy request: ${msg}` },
      { status: 500 }
    )
  }
}

export function createProxyHandler(endpoint: string) {
  return {
    GET: (request: NextRequest) => proxyToBackend(request, { endpoint, method: 'GET' }),
    POST: (request: NextRequest) => proxyToBackend(request, { endpoint, method: 'POST' }),
    PUT: (request: NextRequest) => proxyToBackend(request, { endpoint, method: 'PUT' }),
    DELETE: (request: NextRequest) => proxyToBackend(request, { endpoint, method: 'DELETE' }),
    PATCH: (request: NextRequest) => proxyToBackend(request, { endpoint, method: 'PATCH' }),
  }
}