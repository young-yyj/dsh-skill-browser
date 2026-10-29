/** 技能详情弹窗：按"是什么 → 怎么触发 → 输入 → 输出 → 注意 → 元信息 → 原文"梳理。
 * 数据仅来自 detail 接口与本地审核元数据,host 零改动。 */

import { useState } from 'react'
import type { SkillDetailResponse } from '../contracts.ts'
import { getSkillMetadata } from '../skill-metadata.ts'
import { nameColorOf } from './nameColor.ts'
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

const ROLE_KEYS = {
  primary: 'detail.role.primary',
  optional: 'detail.role.optional',
  intermediate: 'detail.role.intermediate',
  result: 'detail.role.result',
} as const

export function SkillDetail({ name, detail, loading, error, t, onClose, onRetry }: SkillDetailProps): React.JSX.Element {
  const [showRaw, setShowRaw] = useState(false)
  const english = t('category.all') === 'All'
  const l = (zhText: string, enText: string): string => english ? enText : zhText
  const metadata = detail === null ? undefined : getSkillMetadata(name)
  const outputs = metadata?.outputs ?? []

  return (
    <div className="qx-sb-modal-layer" data-skill-detail>
      <button className="qx-sb-modal-scrim" type="button" aria-label={t('action.close')} onClick={onClose} />
      <section
        className="qx-sb-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('detail.title') + ': ' + name}
        style={{ '--qxsb-accent': nameColorOf(name) } as React.CSSProperties}
      >
        <header className="qx-sb-modal-head">
          <div className="qx-sb-modal-heading">
            <h2 className="qx-sb-modal-name">{name}</h2>
            <div className="qx-sb-modal-badges">
              {metadata && <span className="qx-sb-badge qx-sb-badge-category">{metadata.category}</span>}
              <span className="qx-sb-badge">{detail?.source ?? ''}</span>
              {detail?.userInvocable && <span className="qx-sb-badge qx-sb-badge-user">{l('✋ 用户可调用', '✋ User invocable')}</span>}
              {detail?.modelInvocable && <span className="qx-sb-badge qx-sb-badge-model">{l('🤖 模型可调用', '🤖 Model invocable')}</span>}
            </div>
          </div>
          <button type="button" className="qx-sb-button qx-sb-icon-button" aria-label={t('action.close')} onClick={onClose}>×</button>
        </header>
        <div className="qx-sb-modal-body" tabIndex={0} aria-label={t('detail.title')}>
          {loading && <div className="qx-sb-state"><div>{t('detail.loading')}</div></div>}
          {error && (
            <div className="qx-sb-state"><div className="qx-sb-state-inner">
              <strong>{t('detail.error', { message: error })}</strong>
              <button type="button" className="qx-sb-button" onClick={onRetry}>{t('action.retry')}</button>
            </div></div>
          )}
          {detail && !loading && !error && (
            <>
              {/* 一句话用途:大字,视觉锚点 */}
              <p className="qx-sb-detail-purpose">{metadata?.purpose ?? (detail.description || t('status.noDescription'))}</p>

              {/* 何时使用:whenToUse(触发词段落)或完整描述 */}
              {(detail.whenToUse || (!metadata && detail.description)) && (
                <section className="qx-sb-detail-section">
                  <h3>{t('detail.whenToUse')}</h3>
                  <div className="qx-sb-detail-text">{detail.whenToUse ?? detail.description}</div>
                </section>
              )}

              {/* 输入 → 输出 双列:决策核心区 */}
              {(metadata || outputs.length > 0) && (
                <div className="qx-sb-detail-flow">
                  <section className="qx-sb-detail-card">
                    <h3>{t('detail.inputs')}</h3>
                    <dl className="qx-sb-flow-list">
                      {metadata?.required && <div className="qx-sb-flow-row"><dt>{t('detail.required')}</dt><dd>{metadata.required}</dd></div>}
                      {metadata?.optional && <div className="qx-sb-flow-row"><dt>{t('detail.optional')}</dt><dd>{metadata.optional}</dd></div>}
                      {metadata?.inputs && metadata.inputs.length > 0 && (
                        <div className="qx-sb-flow-row"><dt>{l('支持类型', 'Supported')}</dt><dd className="qx-sb-io-chips">{metadata.inputs.map(input => <span key={input} className="qx-sb-io-chip" data-input={input}>{input}</span>)}</dd></div>
                      )}
                      {metadata?.noUpload === true && <div className="qx-sb-flow-note">{l('💡', '💡')} {t('detail.noUpload')}</div>}
                    </dl>
                  </section>
                  <section className="qx-sb-detail-card">
                    <h3>{t('detail.outputs')}</h3>
                    {outputs.length > 0 ? (
                      <ul className="qx-sb-out-list">
                        {outputs.map(output => (
                          <li key={output.format} className={'qx-sb-out-row' + (output.role === 'intermediate' ? ' qx-sb-out-intermediate' : '')}>
                            <span className="qx-sb-out-format">{output.format}</span>
                            <span className="qx-sb-out-role">{t(ROLE_KEYS[output.role])}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <div className="qx-sb-detail-text">{l('格式待确认，请查看原始说明', 'Format unconfirmed; see the original instructions')}</div>}
                  </section>
                </div>
              )}

              {/* 注意事项 */}
              {metadata?.note && (
                <section className="qx-sb-detail-section">
                  <h3>{t('detail.note')}</h3>
                  <div className="qx-sb-detail-text">{metadata.note}</div>
                </section>
              )}

              {/* 元信息行 */}
              <div className="qx-sb-detail-meta">
                {detail.path && <span className="qx-sb-meta-item" title={detail.path}><b>{t('detail.path')}</b> {detail.path}</span>}
                <span className="qx-sb-meta-item"><b>{t('detail.source')}</b> {detail.source}</span>
                <span className="qx-sb-meta-item"><b>{t('detail.provider')}</b> {detail.provider}</span>
              </div>

              {/* 元数据解析失败提示(host frontmatter) */}
              {detail.metadataError && <pre className="qx-sb-pre">{t('detail.metaError')}
{detail.metadataError}</pre>}

              {/* 原文:默认折叠 */}
              <details className="qx-sb-raw" onToggle={event => setShowRaw((event.target as HTMLDetailsElement).open)}>
                <summary>{showRaw ? t('detail.rawHide') : t('detail.raw')}</summary>
                <pre className="qx-sb-pre">{detail.content}</pre>
                {detail.contentTruncated && <p className="qx-sb-truncated">{t('detail.truncated')}</p>}
                {detail.metadata !== undefined && <section className="qx-sb-detail-section"><h3>{t('detail.metadata')}</h3><pre className="qx-sb-pre">{metadataText(detail.metadata)}</pre></section>}
              </details>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
