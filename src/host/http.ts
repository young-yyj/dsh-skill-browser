import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ErrorResponse } from '../contracts.ts'

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
} as const

export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, JSON_HEADERS)
  res.end(JSON.stringify(body))
}

export function sendError(
  res: ServerResponse,
  status: number,
  code: string,
  message: string,
): void {
  const body: ErrorResponse = { error: { code, message } }
  sendJson(res, status, body)
}

export function methodIs(req: IncomingMessage, method: 'GET'): boolean {
  return req.method === method
}

export function urlOf(req: IncomingMessage): URL | undefined {
  try {
    return new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
  } catch {
    return undefined
  }
}

export function boundedQuery(
  params: URLSearchParams,
  key: string,
  maxLength: number,
): string | undefined {
  const values = params.getAll(key)
  if (values.length !== 1) return undefined
  const value = values[0]
  if (value === undefined || value.length === 0 || value.length > maxLength) return undefined
  return value
}
