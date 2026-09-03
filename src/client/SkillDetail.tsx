import type { SkillDetailResponse } from '../contracts.ts'
import type { SkillBrowserTranslate } from './SkillBrowser.tsx'

export interface SkillDetailProps {
  name: string
  detail: SkillDetailResponse | null
  loading: boolean
  error: string | null
  t: SkillBrowserTranslate
  onClose: () => void
  onRetry: () => void
}

function metadataText(metadata: unknown): string {
  if (metadata === undefined) return ''
  try {
    return JSON.stringify(metadata, null, 2)
  } catch {
    return String(metadata)
  }
}

export function SkillDetail({ name, detail, loading, error, t, onClose, onRetry }: SkillDetailProps): React.JSX.Element {
  return (
    <>
      <button className="qx-sb-drawer-scrim" type="button" aria-label={t('action.close')} onClick={onClose} />
      <aside className="qx-sb-drawer" data-skill-detail aria-label={t('detail.title')}>
        <header className="qx-sb-drawer-head">
          <div>
            <div className="qx-sb-drawer-kicker">{t('detail.title')}</div>
            <h2 className="qx-sb-drawer-title">{name}</h2>
          </div>
          <button type="button" className="qx-sb-button qx-sb-icon-button" aria-label={t('action.close')} onClick={onClose}>×</button>
        </header>
        <div className="qx-sb-drawer-body" tabIndex={0} aria-label={t('detail.content')}>
          {loading && <div className="qx-sb-state"><div>{t('detail.loading')}</div></div>}
          {error && (
            <div className="qx-sb-state"><div className="qx-sb-state-inner">
              <strong>{t('detail.error', { message: error })}</strong>
              <button type="button" className="qx-sb-button" onClick={onRetry}>{t('action.retry')}</button>
            </div></div>
          )}
          {detail && !loading && !error && (
            <>
              <div className="qx-sb-detail-desc">{detail.description}</div>
              {detail.whenToUse && <section className="qx-sb-detail-section"><h3>{t('detail.whenToUse')}</h3><div>{detail.whenToUse}</div></section>}
              <dl className="qx-sb-detail-section">
                {detail.path && <div className="qx-sb-detail-row"><dt>{t('detail.path')}</dt><dd>{detail.path}</dd></div>}
                <div className="qx-sb-detail-row"><dt>{t('detail.source')}</dt><dd>{detail.source}</dd></div>
                <div className="qx-sb-detail-row"><dt>{t('detail.provider')}</dt><dd>{detail.provider}</dd></div>
              </dl>
              <section className="qx-sb-detail-section"><h3>{t('detail.content')}</h3><pre className="qx-sb-pre">{detail.content}</pre>{detail.contentTruncated && <p className="qx-sb-truncated">{t('detail.truncated')}</p>}</section>
              {detail.metadata !== undefined && <section className="qx-sb-detail-section"><h3>{t('detail.metadata')}</h3><pre className="qx-sb-pre">{metadataText(detail.metadata)}</pre></section>}
            </>
          )}
        </div>
      </aside>
    </>
  )
}
