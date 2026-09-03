import {
  errorMessage,
  isCatalogResponse,
  isErrorResponse,
  isSkillDetailResponse,
  type CatalogResponse,
  type SkillDetailResponse,
} from '../contracts.ts'

type EventSourceConstructor = new (url: string | URL, eventSourceInitDict?: EventSourceInit) => EventSource

export class SkillBrowserApiError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'SkillBrowserApiError'
  }
}

export class SkillBrowserApi {
  private readonly fetcher: typeof fetch
  private readonly EventSourceCtor: EventSourceConstructor

  constructor(
    fetcher: typeof fetch = (input, init) => globalThis.fetch(input, init),
    EventSourceCtor: EventSourceConstructor = EventSource,
  ) {
    this.fetcher = fetcher
    this.EventSourceCtor = EventSourceCtor
  }

  async catalog(sessionId: string, signal?: AbortSignal): Promise<CatalogResponse> {
    const query = `sessionId=${encodeURIComponent(sessionId)}`
    return this.get(`/api/dsh-skill-browser/catalog?${query}`, isCatalogResponse, signal)
  }

  async detail(
    sessionId: string,
    name: string,
    signal?: AbortSignal,
  ): Promise<SkillDetailResponse> {
    const query = `sessionId=${encodeURIComponent(sessionId)}&name=${encodeURIComponent(name)}`
    return this.get(`/api/dsh-skill-browser/detail?${query}`, isSkillDetailResponse, signal)
  }

  subscribe(sessionId: string, onCatalog: () => void): () => void {
    const query = `sessionId=${encodeURIComponent(sessionId)}`
    const source = new this.EventSourceCtor(`/api/dsh-skill-browser/events?${query}`)
    const listener: EventListener = () => onCatalog()
    source.addEventListener('catalog', listener)
    let disposed = false
    return () => {
      if (disposed) return
      disposed = true
      source.removeEventListener('catalog', listener)
      source.close()
    }
  }

  private async get<T>(
    path: string,
    guard: (value: unknown) => value is T,
    signal?: AbortSignal,
  ): Promise<T> {
    const fetcher = this.fetcher
    const response = await fetcher(path, {
      method: 'GET',
      cache: 'no-store',
      signal,
    })
    const body: unknown = await response.json().catch(() => undefined)
    if (!response.ok) {
      const code = isErrorResponse(body) ? body.error.code : 'request-failed'
      throw new SkillBrowserApiError(code, errorMessage(body))
    }
    if (!guard(body)) {
      throw new SkillBrowserApiError('invalid-response', 'invalid skill browser response')
    }
    return body
  }
}
