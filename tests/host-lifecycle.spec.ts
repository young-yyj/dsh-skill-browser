import { EventEmitter } from 'node:events'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apply } from '../src/index.ts'
import { CatalogService } from '../src/host/catalog-service.ts'

class SseResponse extends EventEmitter {
  chunks: string[] = []
  ended = false
  writeHead(): this { return this }
  write(chunk: string): boolean { this.chunks.push(String(chunk)); return true }
  end(): this { this.ended = true; return this }
}

afterEach(() => vi.useRealTimers())

describe('host lifecycle', () => {
  it('registers three routes, debounces invalidation, and disposes every resource', async () => {
    vi.useFakeTimers()
    const routeDisposers = [vi.fn(), vi.fn(), vi.fn()]
    const routes: Array<{ path: string; handler: (req: unknown, res: unknown) => unknown }> = []
    let change: (() => void) | undefined
    let cleanup: (() => void) | undefined
    const stopChange = vi.fn()
    const watch = vi.spyOn(CatalogService.prototype, 'watch').mockImplementation(listener => {
      change = listener
      return stopChange
    })
    const ctx = {
      webServer: {
        register: vi.fn((route: typeof routes[number]) => {
          routes.push(route)
          return routeDisposers[routes.length - 1]
        }),
      },
      effect: vi.fn((factory: () => () => void) => {
        cleanup = factory()
        return vi.fn()
      }),
      logger: { warn: vi.fn() },
    }

    apply(ctx as never)
    expect(routes.map(route => route.path)).toHaveLength(3)

    const eventsRoute = routes.find(route => route.path.endsWith('/events'))
    const response = new SseResponse()
    await eventsRoute?.handler({
      method: 'GET',
      url: '/api/dsh-skill-browser/events?sessionId=s1',
      socket: { remoteAddress: '127.0.0.1' },
      headers: { host: '127.0.0.1:2026' },
    }, response)

    change?.()
    change?.()
    await vi.advanceTimersByTimeAsync(199)
    expect(response.chunks.join('')).not.toContain('revision')
    await vi.advanceTimersByTimeAsync(1)
    expect(response.chunks.join('')).toContain('{"revision":1}')

    cleanup?.()
    expect(stopChange).toHaveBeenCalledOnce()
    expect(routeDisposers.every(dispose => dispose.mock.calls.length === 1)).toBe(true)
    expect(response.ended).toBe(true)
    watch.mockRestore()
  })

  it('rolls back earlier routes when a later registration fails', () => {
    const disposeFirst = vi.fn()
    const register = vi.fn()
      .mockReturnValueOnce(disposeFirst)
      .mockImplementationOnce(() => { throw new Error('route collision') })
    const ctx = {
      webServer: { register },
      effect: vi.fn((factory: () => () => void) => factory()),
      logger: { warn: vi.fn() },
    }

    expect(() => apply(ctx as never)).toThrow('route collision')
    expect(disposeFirst).toHaveBeenCalledOnce()
  })
})
