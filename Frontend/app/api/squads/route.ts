// app/api/squads/route.ts
import { createProxyHandler } from '@/lib/api-proxy'

const handlers = createProxyHandler('/api/squads')

export const GET = handlers.GET
export const POST = handlers.POST
export const PUT = handlers.PUT
export const DELETE = handlers.DELETE
