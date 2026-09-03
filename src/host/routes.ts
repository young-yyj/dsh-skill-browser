import type { Context } from '@deepseek-ai/cordis'
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'
import { isSkillName } from '../contracts.ts'
import { isAllowedRequest } from './access.ts'
import { CatalogError, type CatalogService } from './catalog-service.ts'
import type { CatalogEventHub } from './events.ts'
import { boundedQuery, methodIs, sendError, sendJson, urlOf } from './http.ts'
import { SessionSkillViewError } from './session-skill-view.ts'

export const ROUTES = {
  catalog: '/api/dsh-skill-browser/catalog',
  detail: '/api/dsh-skill-browser/detail',
  events: '/api/dsh-skill-browser/events',
} as const

interface RouteDependencies {
  catalog: Pick<CatalogService, 'assertSession' | 'list' | 'detail'>
  events: CatalogEventHub
}

function statusFor(error: CatalogError | SessionSkillViewError): number {
  if (error.code === 'skill/not-found' || error.code === 'session/not-found') return 404
  if (error.code === 'session/unavailable') return 503
  return 409
}

export function makeRoutes(ctx: Context, dependencies: RouteDependencies): WebRoute[] {
  const prepare = (req: Parameters<WebRoute['handler']>[0], res: Parameters<WebRoute['handler']>[1]) => {
    if (!isAllowedRequest(req)) {
      sendError(res, 403, 'request/forbidden', 'skill browser is available only to the local DSH page')
      return undefined
    }
    if (!methodIs(req, 'GET')) {
      sendError(res, 405, 'request/method-not-allowed', 'only GET is supported')
      return undefined
    }
    const url = urlOf(req)
    if (url === undefined) {
      sendError(res, 400, 'request/invalid-url', 'invalid request URL')
      return undefined
    }
    const sessionId = boundedQuery(url.searchParams, 'sessionId', 256)
    if (sessionId === undefined) {
      sendError(res, 400, 'request/invalid-session', 'sessionId is required and must be at most 256 characters')
      return undefined
    }
    return { url, sessionId }
  }

  const handleError = (res: Parameters<WebRoute['handler']>[1], error: unknown) => {
    if (error instanceof CatalogError || error instanceof SessionSkillViewError) {
      sendError(res, statusFor(error), error.code, error.message)
      return
    }
    ctx.logger.warn(error)
    sendError(res, 500, 'internal', 'skill browser request failed')
  }

  return [
    {
      kind: 'exact',
      path: ROUTES.catalog,
      handler: async (req, res) => {
        const prepared = prepare(req, res)
        if (prepared === undefined) return
        try {
          sendJson(res, 200, await dependencies.catalog.list(prepared.sessionId))
        } catch (error) {
          handleError(res, error)
        }
      },
    },
    {
      kind: 'exact',
      path: ROUTES.detail,
      handler: async (req, res) => {
        const prepared = prepare(req, res)
        if (prepared === undefined) return
        const name = boundedQuery(prepared.url.searchParams, 'name', 128)
        if (!isSkillName(name)) {
          sendError(res, 400, 'request/invalid-skill', 'a valid skill name is required')
          return
        }
        try {
          sendJson(res, 200, await dependencies.catalog.detail(prepared.sessionId, name))
        } catch (error) {
          handleError(res, error)
        }
      },
    },
    {
      kind: 'exact',
      path: ROUTES.events,
      handler: async (req, res) => {
        const prepared = prepare(req, res)
        if (prepared === undefined) return
        try {
          await dependencies.catalog.assertSession(prepared.sessionId)
          const dispose = dependencies.events.subscribe(res)
          if (dispose === undefined) {
            sendError(res, 503, 'events/capacity', 'too many skill browser event streams')
          }
        } catch (error) {
          handleError(res, error)
        }
      },
    },
  ]
}
