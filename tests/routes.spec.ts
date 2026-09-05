import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CatalogError } from '../src/host/catalog-service.ts'
import { CatalogEventHub } from '../src/host/events.ts'
import { makeRoutes, ROUTES } from '../src/host/routes.ts'

class FakeResponse extends EventEmitter {
  statusCode = 0
  headers: Record<string, string> = {}
  chunks: string[] = []
  ended = false

  writeHead(status: number, headers: Record<string, string>): this {
    this.statusCode = status
    this.headers = headers
    return this
  }

  write(chunk: string): boolean {
    this.chunks.push(String(chunk))
    return true
  }

  end(chunk?: string): this {
    if (chunk !== undefined) this.chunks.push(String(chunk))
    this.ended = true
    return this
  }

  json(): unknown {
    return JSON.parse(this.chunks.join(''))
  }
}

function request(url: string, options: { method?: string; address?: string; origin?: string } = {}) {
  return {
    method: options.method ?? 'GET',
    url,
    socket: { remoteAddress: options.address ?? '127.0.0.1' },
    headers: {
      host: '127.0.0.1:2026',
      origin: options.origin ?? 'http://127.0.0.1:2026',
      'sec-fetch-site': 'same-origin',
    },
  }
}

describe('skill browser routes', () => {
  const catalog = {
    list: vi.fn(),
    detail: vi.fn(),
  }
  const logger = { warn: vi.fn() }
  let events: CatalogEventHub
  let routes: ReturnType<typeof makeRoutes>

  beforeEach(() => {
    catalog.list.mockReset()
    catalog.detail.mockReset()
    logger.warn.mockReset()
    events = new CatalogEventHub()
    routes = makeRoutes({ logger } as never, { catalog: catalog as never, events })
  })

  async function invoke(path: string, req: ReturnType<typeof request>): Promise<FakeResponse> {
    const response = new FakeResponse()
    const route = routes.find(candidate => candidate.path === path)
    expect(route).toBeDefined()
    await route?.handler(req as never, response as never)
    return response
  }

  it('returns a catalog and detail through read-only GET routes', async () => {
    catalog.list.mockResolvedValue({ revision: 0, skills: [] })
    catalog.detail.mockResolvedValue({ name: 'pdf', content: 'body' })
    const list = await invoke(ROUTES.catalog, request(`${ROUTES.catalog}?sessionId=s1`))
    const detail = await invoke(ROUTES.detail, request(`${ROUTES.detail}?sessionId=s1&name=pdf`))
    expect(list.statusCode).toBe(200)
    expect(list.json()).toEqual({ revision: 0, skills: [] })
    expect(detail.statusCode).toBe(200)
    expect(detail.json()).toEqual({ name: 'pdf', content: 'body' })
    expect(catalog.detail).toHaveBeenCalledWith('pdf')
    expect(list.headers['cache-control']).toBe('no-store')
  })

  it('rejects invalid parameters before touching the catalog', async () => {
    const missing = await invoke(ROUTES.catalog, request(ROUTES.catalog))
    const long = await invoke(ROUTES.catalog, request(`${ROUTES.catalog}?sessionId=${'x'.repeat(257)}`))
    const name = await invoke(ROUTES.detail, request(`${ROUTES.detail}?sessionId=s1&name=../bad`))
    expect([missing.statusCode, long.statusCode, name.statusCode]).toEqual([400, 400, 400])
    expect(catalog.list).not.toHaveBeenCalled()
    expect(catalog.detail).not.toHaveBeenCalled()
  })

  it('rejects writes and non-loopback clients', async () => {
    const post = await invoke(ROUTES.catalog, request(`${ROUTES.catalog}?sessionId=s1`, { method: 'POST' }))
    const lan = await invoke(ROUTES.catalog, request(`${ROUTES.catalog}?sessionId=s1`, { address: '10.0.0.4' }))
    expect(post.statusCode).toBe(405)
    expect(lan.statusCode).toBe(403)
  })

  it('maps known failures and hides unexpected error details', async () => {
    catalog.detail.mockRejectedValueOnce(new CatalogError('skill/not-found', 'missing'))
    const known = await invoke(ROUTES.detail, request(`${ROUTES.detail}?sessionId=s1&name=pdf`))
    expect(known.statusCode).toBe(404)
    expect(known.json()).toEqual({ error: { code: 'skill/not-found', message: 'missing' } })

    catalog.list.mockRejectedValueOnce(new Error('secret stack detail'))
    const unknown = await invoke(ROUTES.catalog, request(`${ROUTES.catalog}?sessionId=s1`))
    expect(unknown.statusCode).toBe(500)
    expect(JSON.stringify(unknown.json())).not.toContain('secret')
    expect(logger.warn).toHaveBeenCalledOnce()
  })

  it('holds an SSE response, publishes revisions, and removes closed clients', async () => {
    const response = await invoke(ROUTES.events, request(`${ROUTES.events}?sessionId=s1`))
    expect(response.statusCode).toBe(200)
    expect(response.ended).toBe(false)
    expect(response.chunks.join('')).toContain(': connected')
    events.publish(7)
    expect(response.chunks.join('')).toContain('event: catalog')
    expect(response.chunks.join('')).toContain('{"revision":7}')
    const before = response.chunks.length
    response.emit('close')
    events.publish(8)
    expect(response.chunks).toHaveLength(before)
  })

  it('opens an SSE stream without resolving the selected session', async () => {
    const response = await invoke(ROUTES.events, request(`${ROUTES.events}?sessionId=missing`))
    expect(response.statusCode).toBe(200)
    expect(response.ended).toBe(false)
  })
})
