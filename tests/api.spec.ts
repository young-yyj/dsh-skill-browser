import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CatalogResponse, SkillDetailResponse } from '../src/contracts.ts'
import { SkillBrowserApi, SkillBrowserApiError } from '../src/client/api.ts'

const summary = {
  name: 'pdf',
  description: 'PDF documents',
  source: 'bundled',
  provider: 'filesystem',
  modelInvocable: true,
  userInvocable: true,
  category: 'documents',
} as const

const catalog: CatalogResponse = {
  revision: 0,
  complete: true,
  generatedAt: '2026-09-03T01:00:00.000Z',
  cwd: 'C:/work',
  skills: [summary],
}

const detail: SkillDetailResponse = {
  ...summary,
  content: 'PDF body',
  contentTruncated: false,
}

class FakeEventSource {
  static instances: FakeEventSource[] = []
  readonly listeners = new Map<string, EventListener>()
  readonly close = vi.fn()

  constructor(readonly url: string) {
    FakeEventSource.instances.push(this)
  }

  addEventListener(name: string, listener: EventListener): void {
    this.listeners.set(name, listener)
  }

  removeEventListener(name: string): void {
    this.listeners.delete(name)
  }

  emit(name: string): void {
    this.listeners.get(name)?.(new Event(name))
  }
}

describe('SkillBrowserApi', () => {
  beforeEach(() => FakeEventSource.instances.splice(0))

  it('encodes session and skill names into read-only GET URLs', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify(detail), { status: 200 }))
    const api = new SkillBrowserApi(fetcher as typeof fetch, FakeEventSource as never)
    const controller = new AbortController()
    await expect(api.detail('session 1', 'pdf', controller.signal)).resolves.toEqual(detail)
    expect(fetcher).toHaveBeenCalledWith(
      '/api/dsh-skill-browser/detail?sessionId=session%201&name=pdf',
      { method: 'GET', cache: 'no-store', signal: controller.signal },
    )
  })

  it('does not rebind an injected fetch implementation to the API instance', async () => {
    const fetcher = vi.fn(function (this: unknown) {
      if (this !== undefined) throw new TypeError('Illegal invocation')
      return Promise.resolve(new Response(JSON.stringify(catalog), { status: 200 }))
    }) as unknown as typeof fetch
    const api = new SkillBrowserApi(fetcher, FakeEventSource as never)
    await expect(api.catalog('s1')).resolves.toEqual(catalog)
  })

  it('loads and validates a catalog response', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify(catalog), { status: 200 }))
    const api = new SkillBrowserApi(fetcher as typeof fetch, FakeEventSource as never)
    await expect(api.catalog('s1')).resolves.toEqual(catalog)
    expect(fetcher).toHaveBeenCalledWith(
      '/api/dsh-skill-browser/catalog?sessionId=s1',
      { method: 'GET', cache: 'no-store', signal: undefined },
    )
  })

  it('rejects malformed JSON and malformed response shapes', async () => {
    const malformedJson = new SkillBrowserApi(
      vi.fn(async () => new Response('{', { status: 200 })) as typeof fetch,
      FakeEventSource as never,
    )
    await expect(malformedJson.catalog('s1')).rejects.toMatchObject({ code: 'invalid-response' })

    const wrongShape = new SkillBrowserApi(
      vi.fn(async () => new Response(JSON.stringify({ skills: 'wrong' }), { status: 200 })) as typeof fetch,
      FakeEventSource as never,
    )
    await expect(wrongShape.catalog('s1')).rejects.toMatchObject({ code: 'invalid-response' })
  })

  it('preserves only a bounded server error message', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      error: { code: 'skill/not-found', message: 'x'.repeat(2_000) },
    }), { status: 404 }))
    const api = new SkillBrowserApi(fetcher as typeof fetch, FakeEventSource as never)
    const error = await api.detail('s1', 'pdf').catch(value => value)
    expect(error).toBeInstanceOf(SkillBrowserApiError)
    expect(error).toMatchObject({ code: 'skill/not-found' })
    expect((error as Error).message).toHaveLength(512)
  })

  it('uses a generic error for non-JSON failures', async () => {
    const fetcher = vi.fn(async () => new Response('gateway text', { status: 502 }))
    const api = new SkillBrowserApi(fetcher as typeof fetch, FakeEventSource as never)
    await expect(api.catalog('s1')).rejects.toEqual(
      new SkillBrowserApiError('request-failed', 'skill browser request failed'),
    )
  })

  it('subscribes to catalog events and removes every resource on cleanup', () => {
    const api = new SkillBrowserApi(vi.fn() as never, FakeEventSource as never)
    const onCatalog = vi.fn()
    const dispose = api.subscribe('session 1', onCatalog)
    const source = FakeEventSource.instances[0]
    expect(source?.url).toBe('/api/dsh-skill-browser/events?sessionId=session%201')
    source?.emit('catalog')
    expect(onCatalog).toHaveBeenCalledOnce()
    dispose()
    expect(source?.listeners.size).toBe(0)
    expect(source?.close).toHaveBeenCalledOnce()
  })
})
