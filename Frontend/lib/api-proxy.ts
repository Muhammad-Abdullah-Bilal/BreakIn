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
    
    // Prepare request options
    const requestOptions: RequestInit = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    }
    
    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(method) && request.body) {
      let body = await request.json()
      if (transformBody) {
        body = transformBody(body)
      }
      requestOptions.body = JSON.stringify(body)
    }
    
    console.log(`🔍 Proxying ${method} request to:`, backendUrl.toString())
    
    const response = await fetch(backendUrl.toString(), requestOptions)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Backend API error: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    console.log(`✅ Successfully proxied ${method} request`)
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('❌ Proxy request failed:', error)
    return NextResponse.json(
      { error: `Failed to proxy request: ${error.message}` },
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