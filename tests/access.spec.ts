import { describe, expect, it } from 'vitest'
import { isAllowedRequest } from '../src/host/access.ts'

function request(options: {
  address?: string
  host?: string
  origin?: string
  fetchSite?: string
  encrypted?: boolean
}) {
  return {
    socket: { remoteAddress: options.address, encrypted: options.encrypted },
    headers: {
      host: options.host,
      origin: options.origin,
      'sec-fetch-site': options.fetchSite,
    },
  }
}

describe('isAllowedRequest', () => {
  it.each(['127.0.0.1', '::1', '::ffff:127.0.0.1'])('allows loopback %s', address => {
    expect(isAllowedRequest(request({ address, host: '127.0.0.1:2026' }) as never)).toBe(true)
  })

  it('rejects LAN clients', () => {
    expect(isAllowedRequest(request({
      address: '192.168.1.8',
      host: '127.0.0.1:2026',
    }) as never)).toBe(false)
  })

  it('rejects a cross-site fetch hint', () => {
    expect(isAllowedRequest(request({
      address: '127.0.0.1',
      host: '127.0.0.1:2026',
      fetchSite: 'cross-site',
    }) as never)).toBe(false)
  })

  it('rejects a mismatched or malformed Origin', () => {
    expect(isAllowedRequest(request({
      address: '127.0.0.1',
      host: '127.0.0.1:2026',
      origin: 'https://evil.example',
    }) as never)).toBe(false)
    expect(isAllowedRequest(request({
      address: '127.0.0.1',
      host: '127.0.0.1:2026',
      origin: 'not a url',
    }) as never)).toBe(false)
  })

  it('allows a matching same-origin browser request', () => {
    expect(isAllowedRequest(request({
      address: '127.0.0.1',
      host: '127.0.0.1:2026',
      origin: 'http://127.0.0.1:2026',
      fetchSite: 'same-origin',
    }) as never)).toBe(true)
  })

  it('rejects rebinding hosts, non-loopback hostnames, and scheme mismatches', () => {
    expect(isAllowedRequest(request({
      address: '127.0.0.1',
      host: 'evil.example:2026',
      origin: 'http://evil.example:2026',
      fetchSite: 'same-origin',
    }) as never)).toBe(false)
    expect(isAllowedRequest(request({
      address: '127.0.0.1',
      host: '127.0.0.1:2026',
      origin: 'https://127.0.0.1:2026',
      fetchSite: 'same-origin',
    }) as never)).toBe(false)
  })

  it('rejects browser fetch metadata other than same-origin', () => {
    expect(isAllowedRequest(request({
      address: '127.0.0.1',
      host: 'localhost:2026',
      fetchSite: 'same-site',
    }) as never)).toBe(false)
  })
})
