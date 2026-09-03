import type { ServerResponse } from 'node:http'

export class CatalogEventHub {
  private readonly clients = new Map<ServerResponse, () => void>()

  constructor(private readonly maxClients = 32) {}

  subscribe(res: ServerResponse): (() => void) | undefined {
    if (this.clients.size >= this.maxClients) return undefined
    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-store',
      connection: 'keep-alive',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    })
    const dispose = () => {
      if (!this.clients.delete(res)) return
      res.off('close', dispose)
    }
    this.clients.set(res, dispose)
    res.once('close', dispose)
    if (!res.write(': connected\n\n')) {
      dispose()
      res.end()
    }
    return dispose
  }

  publish(revision: number): void {
    const frame = `event: catalog\ndata: ${JSON.stringify({ revision })}\n\n`
    for (const [client, dispose] of [...this.clients]) {
      try {
        if (!client.write(frame)) {
          dispose()
          client.end()
        }
      } catch {
        dispose()
        client.end()
      }
    }
  }

  close(): void {
    for (const [client, dispose] of [...this.clients]) {
      dispose()
      client.end()
    }
  }
}
