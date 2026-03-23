import { toNextJsHandler } from 'better-auth/next-js'
import { createAuth } from '@/lib/auth/auth'

export async function GET(request: Request): Promise<Response> {
  const handler = toNextJsHandler(await createAuth())
  return handler.GET(request)
}

export async function POST(request: Request): Promise<Response> {
  const handler = toNextJsHandler(await createAuth())
  return handler.POST(request)
}
