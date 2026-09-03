import { EventEmitter } from 'node:events'
import { describe, expect, it } from 'vitest'
import { CatalogEventHub } from '../src/host/events.ts'

class FakeResponse extends EventEmitter {
  chunks: string[] = []
  ended = false
  writable = true

  writeHead(): this { return this }
  write(chunk: string): boolean {
    this.chunks.push(String(chunk))
    return this.writable
  }
  end(): this {
    this.ended = true
    return this
  }
}

describe('CatalogEventHub', () => {
  it('limits concurrent streams before writing response headers', () => {
    const hub = new CatalogEventHub(1)
    const first = new FakeResponse()
    const second = new FakeResponse()
    expect(hub.subscribe(first as never)).toEqual(expect.any(Function))
    expect(hub.subscribe(second as never)).toBeUndefined()
    expect(second.chunks).toHaveLength(0)
  })

  it('drops a slow client when a publish encounters backpressure', () => {
    const hub = new CatalogEventHub()
    const slow = new FakeResponse()
    hub.subscribe(slow as never)
    slow.writable = false
    hub.publish(1)
    expect(slow.ended).toBe(true)
    const chunks = slow.chunks.length
    hub.publish(2)
    expect(slow.chunks).toHaveLength(chunks)
  })
})
