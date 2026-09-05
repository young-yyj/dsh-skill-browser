import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import { CatalogService } from './host/catalog-service.ts'
import { CatalogEventHub } from './host/events.ts'
import { makeRoutes } from './host/routes.ts'

export const name = 'skill-browser'
export const inject = ['webServer']

export function apply(ctx: Context): void {
  ctx.effect(() => {
    const catalog = new CatalogService()
    const events = new CatalogEventHub()
    const routeDisposers: Array<() => void> = []
    try {
      for (const route of makeRoutes(ctx, { catalog, events })) {
        routeDisposers.push(ctx.webServer.register(route))
      }
    } catch (error) {
      for (const dispose of routeDisposers.reverse()) dispose()
      events.close()
      throw error
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    const stopChange = catalog.watch(() => {
      if (timer !== undefined) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = undefined
        events.publish(catalog.invalidate())
      }, 200)
    })

    return () => {
      if (timer !== undefined) clearTimeout(timer)
      stopChange()
      for (const dispose of routeDisposers.reverse()) dispose()
      events.close()
    }
  }, 'skill-browser: host lifecycle')
}
