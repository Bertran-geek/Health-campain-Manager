import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

type RouteCtx = { params: Promise<{ path: string[] }> }

async function proxyRequest(request: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params
  const pathStr = path.join('/')
  const search = request.nextUrl.search
  const url = `${BACKEND}/${pathStr}${search}`

  const contentType = request.headers.get('Content-Type') || 'application/json'
  const headers: Record<string, string> = { 'Content-Type': contentType }
  const auth = request.headers.get('Authorization')
  if (auth) headers['Authorization'] = auth

  let body: string | undefined
  if (!['GET', 'HEAD'].includes(request.method)) {
    body = await request.text()
  }

  try {
    const res = await fetch(url, { method: request.method, headers, body })
    const data = await res.text()
    const resContentType = res.headers.get('Content-Type') || 'application/json'
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': resContentType },
    })
  } catch {
    return NextResponse.json({ detail: 'Backend unreachable' }, { status: 502 })
  }
}

export async function GET(req: NextRequest, ctx: RouteCtx) { return proxyRequest(req, ctx) }
export async function POST(req: NextRequest, ctx: RouteCtx) { return proxyRequest(req, ctx) }
export async function PUT(req: NextRequest, ctx: RouteCtx) { return proxyRequest(req, ctx) }
export async function DELETE(req: NextRequest, ctx: RouteCtx) { return proxyRequest(req, ctx) }
