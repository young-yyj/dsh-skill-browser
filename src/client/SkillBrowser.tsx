import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import {
  type CatalogResponse,
  type SkillDetailResponse,
} from '../contracts.ts'
import { focusableElements, trapTab } from './focus.ts'
import { SkillExplorer } from './SkillExplorer.tsx'
import { SkillDetail } from './SkillDetail.tsx'
import type { SkillBrowserLocaleKey } from './locales.ts'

export type SkillBrowserTranslate = Translate<SkillBrowserLocaleKey>

export interface SkillBrowserClient {
  catalog(sessionId: string, signal?: AbortSignal): Promise<CatalogResponse>
  detail(sessionId: string, name: string, signal?: AbortSignal): Promise<SkillDetailResponse>
  subscribe(sessionId: string, onCatalog: () => void): () => void
}

export interface SkillBrowserEntryProps {
  sessionId: string
  api: SkillBrowserClient
  t: SkillBrowserTranslate
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function CatalogState({ title, detail, t, retry }: {
  title: string
  detail?: string
  t: SkillBrowserTranslate
  retry?: () => void
}): React.JSX.Element {
  return (
    <div className="qx-sb-state"><div className="qx-sb-state-inner">
      <strong>{title}</strong>
      {detail && <div>{detail}</div>}
      {retry && <p><button type="button" className="qx-sb-button" onClick={retry}>{t('action.retry')}</button></p>}
    </div></div>
  )
}

function SkillBrowserModal({ sessionId, api, t, onClose }: SkillBrowserEntryProps & { onClose: () => void }): React.JSX.Element {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const catalogAbort = useRef<AbortController | null>(null)
  const detailAbort = useRef<AbortController | null>(null)
  const catalogGeneration = useRef(0)
  const detailGeneration = useRef(0)
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [detail, setDetail] = useState<SkillDetailResponse | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailRefreshKey, setDetailRefreshKey] = useState(0)
  const selectedNameRef = useRef<string | null>(null)
  selectedNameRef.current = selectedName

  const loadCatalog = useCallback(async () => {
    catalogAbort.current?.abort()
    const controller = new AbortController()
    const generation = ++catalogGeneration.current
    catalogAbort.current = controller
    setLoading(true)
    setCatalogError(null)
    try {
      const next = await api.catalog(sessionId, controller.signal)
      if (controller.signal.aborted || generation !== catalogGeneration.current) return
      setCatalog(next)
      const selected = selectedNameRef.current
      if (selected && next.skills.some(skill => skill.name === selected)) {
        setDetailRefreshKey(current => current + 1)
      } else if (selected) {
        setSelectedName(null)
      }
    } catch (error) {
      if (!controller.signal.aborted && generation === catalogGeneration.current && !isAbort(error)) {
        setCatalogError(messageOf(error))
      }
    } finally {
      if (!controller.signal.aborted && generation === catalogGeneration.current) setLoading(false)
    }
  }, [api, sessionId])

  const closeDetail = useCallback(() => {
    const name = selectedNameRef.current
    detailAbort.current?.abort()
    setSelectedName(null)
    setDetail(null)
    setDetailError(null)
    queueMicrotask(() => {
      if (!name) return
      const card = [...(dialogRef.current?.querySelectorAll<HTMLElement>('[data-skill-card]') ?? [])]
        .find(element => element.dataset.skillCard === name)
      card?.querySelector<HTMLElement>('.qx-sb-card-name')?.focus()
    })
  }, [])

  useEffect(() => {
    void loadCatalog()
    const dispose = api.subscribe(sessionId, () => { void loadCatalog() })
    return () => {
      catalogGeneration.current += 1
      catalogAbort.current?.abort()
      detailGeneration.current += 1
      detailAbort.current?.abort()
      dispose()
    }
  }, [api, loadCatalog, sessionId])

  useEffect(() => {
    if (!selectedName) return
    detailAbort.current?.abort()
    const controller = new AbortController()
    const generation = ++detailGeneration.current
    detailAbort.current = controller
    setDetail(null)
    setDetailError(null)
    setDetailLoading(true)
    void api.detail(sessionId, selectedName, controller.signal).then(next => {
      if (!controller.signal.aborted && generation === detailGeneration.current) setDetail(next)
    }).catch(error => {
      if (!controller.signal.aborted && generation === detailGeneration.current && !isAbort(error)) {
        setDetailError(messageOf(error))
      }
    }).finally(() => {
      if (!controller.signal.aborted && generation === detailGeneration.current) setDetailLoading(false)
    })
    queueMicrotask(() => dialogRef.current?.querySelector<HTMLElement>('.qx-sb-drawer .qx-sb-icon-button')?.focus())
    return () => controller.abort()
  }, [api, detailRefreshKey, selectedName, sessionId])

  useEffect(() => {
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    queueMicrotask(() => searchRef.current?.focus())
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (selectedNameRef.current) closeDetail()
        else onClose()
        return
      }
      if (dialogRef.current) trapTab(event, dialogRef.current)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = oldOverflow
    }
  }, [closeDetail, onClose])

  const skills = catalog?.skills ?? []
  const formattedTime = catalog ? new Date(catalog.generatedAt).toLocaleString() : ''

  return createPortal(
    <div
      className="qx-sb-backdrop"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}
    >
      <div ref={dialogRef} className="qx-sb-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="qx-sb-header">
          <div className="qx-sb-heading">
            <span className="qx-sb-mark" aria-hidden="true">🧩</span>
            <div>
              <h1 id={titleId} className="qx-sb-title">{t('dialog.title')}</h1>
              <p className="qx-sb-context">
                <span>{t('dialog.context')}</span>
                {catalog && <span>{t('dialog.count', { count: catalog.skills.length })}</span>}
                {catalog && <span>{t('dialog.generatedAt', { time: formattedTime })}</span>}
              </p>
            </div>
          </div>
          <div className="qx-sb-actions">
            <button type="button" className="qx-sb-button" disabled={loading} onClick={() => { void loadCatalog() }} aria-label={t('action.refresh')}>
              <span aria-hidden="true">↻</span> <span className="qx-sb-button-label">{t('action.refresh')}</span>
            </button>
            <button type="button" className="qx-sb-button qx-sb-icon-button" aria-label={t('action.close')} onClick={onClose}>×</button>
          </div>
        </div>
        <div className="qx-sb-controls">
          <div className="qx-sb-search-wrap">
            <span className="qx-sb-search-glyph" aria-hidden="true">⌕</span>
            <input
              ref={searchRef}
              className="qx-sb-search"
              type="search"
              value={query}
              placeholder={t('search.placeholder')}
              onChange={event => setQuery(event.currentTarget.value)}
            />
            {query && <button type="button" className="qx-sb-button qx-sb-icon-button qx-sb-clear" aria-label={t('search.clear')} onClick={() => setQuery('')}>×</button>}
          </div>
        </div>
        <main className="qx-sb-main">
          {catalog && <div className="qx-sb-context" title={catalog.cwd}>{t('dialog.cwd', { cwd: catalog.cwd })}</div>}
          {catalog && catalogError && <p className="qx-sb-notice" role="status">{t('status.refreshError', { message: catalogError })}</p>}
          {catalog && !catalog.complete && <p className="qx-sb-notice">{t('status.incomplete')}</p>}
          {!catalog && loading && <CatalogState title={t('status.loading')} t={t} />}
          {catalogError && !catalog && <CatalogState title={t('status.error', { message: catalogError })} retry={() => { void loadCatalog() }} t={t} />}
          {catalog && skills.length === 0 && <CatalogState title={t('status.empty')} t={t} />}
          {catalog && skills.length > 0 && <SkillExplorer skills={skills} query={query} onQueryChange={setQuery} t={t} onOpen={setSelectedName} />}
        </main>
        {selectedName && (
          <SkillDetail
            name={selectedName}
            detail={detail}
            loading={detailLoading}
            error={detailError}
            t={t}
            onClose={closeDetail}
            onRetry={() => {
              const current = selectedName
              setSelectedName(null)
              queueMicrotask(() => setSelectedName(current))
            }}
          />
        )}
      </div>
    </div>,
    document.body,
  )
}

export function SkillBrowserEntry({ sessionId, api, t }: SkillBrowserEntryProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    queueMicrotask(() => triggerRef.current?.focus())
  }, [])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="qx-sb-trigger"
        aria-label={t('trigger.ariaLabel')}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">🧩</span>
        <span>{t('trigger.label')}</span>
      </button>
      {open && <SkillBrowserModal sessionId={sessionId} api={api} t={t} onClose={close} />}
    </>
  )
}

export function firstFocusableInSkillBrowser(root: HTMLElement): HTMLElement | undefined {
  return focusableElements(root)[0]
}
