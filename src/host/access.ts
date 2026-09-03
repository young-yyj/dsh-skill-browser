import type { IncomingMessage } from 'node:http'

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]'])

function expectedOrigin(req: IncomingMessage): string | undefined {
  const host = req.headers.host
  if (host === undefined || host.trim() !== host) return undefined
  const protocol = (req.socket as typeof req.socket & { encrypted?: boolean }).encrypted === true
    ? 'https:'
    : 'http:'
  try {
    const url = new URL(`${protocol}//${host}`)
    if (url.pathname !== '/' || url.username !== '' || url.password !== '') return undefined
    if (!LOOPBACK_HOSTS.has(url.hostname.toLowerCase())) return undefined
    return url.origin
  } catch {
    return undefined
  }
}

export function isAllowedRequest(req: IncomingMessage): boolean {
  if (!LOOPBACK.has(req.socket.remoteAddress ?? '')) return false
  const fetchSite = req.headers['sec-fetch-site']
  if (fetchSite !== undefined && fetchSite !== 'same-origin') return false

  const expected = expectedOrigin(req)
  if (expected === undefined) return false

  const origin = req.headers.origin
  if (origin === undefined) return true
  try {
    return new URL(origin).origin === expected
  } catch {
    return false
  }
}
