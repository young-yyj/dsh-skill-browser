/** 技能详情弹窗：按用户的问题分页——概览 / 触发方式 / 输入 / 输出 / 原文。
 * 无内容的页签自动隐藏（如未审核元数据的技能没有输入/输出页）。
 * 数据仅来自 detail 接口与本地审核元数据，host 零改动。 */

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

type TabId = 'overview' | 'trigger' | 'inputs' | 'outputs' | 'raw'

export function SkillDetail({ name, detail, loading, error, t, onClose, onRetry }: SkillDetailProps): React.JSX.Element {
  const [tab, setTab] = useState<TabId>('overview')
  const english = t('category.all') === 'All'
  const l = (zhText: string, enText: string): string => english ? enText : zhText
  const metadata = detail === null ? undefined : getSkillMetadata(name)
  const outputs = metadata?.outputs ?? []
  const hasInputs = metadata !== undefined && (Boolean(metadata.required) || Boolean(metadata.optional) || (metadata.inputs && metadata.inputs.length > 0) || metadata.noUpload === true)
  const hasOutputs = outputs.length > 0
  const hasWhenToUse = Boolean(detail?.whenToUse)

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: t('detail.tab.overview') },
    { id: 'trigger', label: t('detail.tab.trigger') },
    ...(hasInputs ? [{ id: 'inputs' as TabId, label: t('detail.tab.inputs') }] : []),
    ...(hasOutputs ? [{ id: 'outputs' as TabId, label: t('detail.tab.outputs') }] : []),
    { id: 'raw', label: t('detail.tab.raw') },
  ]
  const activeTab = tabs.some(tabDef => tabDef.id === tab) ? tab : 'overview'

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
        <nav className="qx-sb-modal-tabs" role="tablist" aria-label={english ? 'Detail sections' : '详情页签'} onKeyDown={event => {
          const index = tabs.findIndex(tabDef => tabDef.id === activeTab)
          if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return
          const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length
            : event.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length
            : event.key === 'Home' ? 0
            : tabs.length - 1
          event.preventDefault()
          setTab(tabs[next]!.id)
          queueMicrotask(() => document.querySelector<HTMLElement>('.qx-sb-modal-tab[data-tab="' + tabs[next]!.id + '"]')?.focus())
        }}>
            {tabs.map(tabDef => (
              <button
                key={tabDef.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tabDef.id}
                aria-controls="qx-sb-detail-panel"
                id={'qx-sb-detail-tab-' + tabDef.id}
                tabIndex={activeTab === tabDef.id ? 0 : -1}
                data-tab={tabDef.id}
                disabled={loading || Boolean(error)}
                className={'qx-sb-modal-tab' + (activeTab === tabDef.id ? ' qx-sb-modal-tab-on' : '')}
                onClick={() => setTab(tabDef.id)}
              >
                {tabDef.label}
              </button>
            ))}
          </nav>
        <div id="qx-sb-detail-panel" className="qx-sb-modal-body" role="tabpanel" aria-labelledby={'qx-sb-detail-tab-' + activeTab} tabIndex={0} aria-label={t('detail.title')}>
          {loading && <div className="qx-sb-state"><div>{t('detail.loading')}</div></div>}
          {error && (
            <div className="qx-sb-state"><div className="qx-sb-state-inner">
              <strong>{t('detail.error', { message: error })}</strong>
              <button type="button" className="qx-sb-button" onClick={onRetry}>{t('action.retry')}</button>
            </div></div>
          )}
          {detail && !loading && !error && activeTab !== 'overview' && activeTab !== 'raw' && !hasInputs && !hasOutputs && (
            <div className="qx-sb-state"><div className="qx-sb-state-inner">
              <strong>{english ? 'No structured information for this skill' : '该技能暂无结构化信息'}</strong>
            </div></div>
          )}
          {detail && !loading && !error && activeTab === 'overview' && (
            <>
              <p className="qx-sb-detail-purpose">{metadata?.purpose ?? (detail.description || t('status.noDescription'))}</p>
              {detail.metadataError && <p className="qx-sb-detail-metaerror" role="status">{t('detail.metaError')}</p>}
              {hasInputs && hasOutputs && (
                <div className="qx-sb-detail-flow">
                  <section className="qx-sb-detail-card">
                    <h3>{t('detail.inputs')}</h3>
                    <div className="qx-sb-detail-text">{metadata?.required || t('detail.contentFallback')}</div>
                    {metadata?.noUpload === true && <div className="qx-sb-flow-note">{l('💡', '💡')} {t('detail.noUpload')}</div>}
                  </section>
                  <section className="qx-sb-detail-card">
                    <h3>{t('detail.outputs')}</h3>
                    <ul className="qx-sb-out-list">
                      {outputs.slice(0, 4).map(output => (
                        <li key={output.format} className={'qx-sb-out-row' + (output.role === 'intermediate' ? ' qx-sb-out-intermediate' : '')}>
                          <span className="qx-sb-out-format">{output.format}</span>
                          <span className="qx-sb-out-role">{t(ROLE_KEYS[output.role])}</span>
                        </li>
                      ))}
                      {outputs.length > 4 && <li className="qx-sb-out-more">{l('更多 ' + outputs.length + ' 项，见输出页', 'More items on the Outputs tab')}</li>}
                    </ul>
                  </section>
                </div>
              )}
              {metadata?.note && (
                <section className="qx-sb-detail-section">
                  <h3>{t('detail.note')}</h3>
                  <div className="qx-sb-detail-text">{metadata.note}</div>
                </section>
              )}
              <div className="qx-sb-detail-meta">
                {detail.path && <span className="qx-sb-meta-item" title={detail.path}><b>{t('detail.path')}</b> {detail.path}</span>}
                <span className="qx-sb-meta-item"><b>{t('detail.source')}</b> {detail.source}</span>
                <span className="qx-sb-meta-item"><b>{t('detail.provider')}</b> {detail.provider}</span>
              </div>
            </>
          )}
          {detail && !loading && !error && activeTab === 'trigger' && (
            <>
              <section className="qx-sb-detail-section">
                <h3>{t('detail.trigger.howto')}</h3>
                <div className="qx-sb-detail-text">
                  {detail.userInvocable && <p className="qx-sb-trigger-line">{l('✋', '✋')} {t('detail.trigger.user')}</p>}
                  {detail.modelInvocable && <p className="qx-sb-trigger-line">{l('🤖', '🤖')} {t('detail.trigger.model')}</p>}
                  {!detail.userInvocable && !detail.modelInvocable && <p className="qx-sb-trigger-line">{t('detail.trigger.unknown')}</p>}
                </div>
              </section>
              {hasWhenToUse && (
                <section className="qx-sb-detail-section">
                  <h3>{t('detail.trigger.keywords')}</h3>
                  <div className="qx-sb-detail-text">{detail.whenToUse}</div>
                </section>
              )}
              <section className="qx-sb-detail-section">
                <h3>{t('detail.origin')}</h3>
                <div className="qx-sb-detail-meta qx-sb-detail-meta-plain">
                  {detail.path && <span className="qx-sb-meta-item" title={detail.path}><b>{t('detail.path')}</b> {detail.path}</span>}
                  <span className="qx-sb-meta-item"><b>{t('detail.source')}</b> {detail.source}</span>
                  <span className="qx-sb-meta-item"><b>{t('detail.provider')}</b> {detail.provider}</span>
                </div>
              </section>
            </>
          )}
          {detail && !loading && !error && activeTab === 'inputs' && (
            <dl className="qx-sb-flow-list qx-sb-flow-list-page">
              {metadata?.required && <div className="qx-sb-flow-row"><dt>{t('detail.required')}</dt><dd>{metadata.required}</dd></div>}
              {metadata?.optional && <div className="qx-sb-flow-row"><dt>{t('detail.optional')}</dt><dd>{metadata.optional}</dd></div>}
              {metadata?.inputs && metadata.inputs.length > 0 && (
                <div className="qx-sb-flow-row"><dt>{l('支持类型', 'Supported')}</dt><dd className="qx-sb-io-chips">{metadata.inputs.map(input => <span key={input} className="qx-sb-io-chip" data-input={input}>{input}</span>)}</dd></div>
              )}
              {metadata?.noUpload === true && <div className="qx-sb-flow-note">{l('💡', '💡')} {t('detail.noUpload')}</div>}
            </dl>
          )}
          {detail && !loading && !error && activeTab === 'outputs' && (
            <>
              <ul className="qx-sb-out-list qx-sb-out-list-page">
                {outputs.map(output => (
                  <li key={output.format} className={'qx-sb-out-row' + (output.role === 'intermediate' ? ' qx-sb-out-intermediate' : '')}>
                    <span className="qx-sb-out-format">{output.format}</span>
                    <span className="qx-sb-out-role">{t(ROLE_KEYS[output.role])}</span>
                  </li>
                ))}
              </ul>
              {metadata?.note && (
                <section className="qx-sb-detail-section">
                  <h3>{t('detail.note')}</h3>
                  <div className="qx-sb-detail-text">{metadata.note}</div>
                </section>
              )}
            </>
          )}
          {detail && !loading && !error && activeTab === 'raw' && (
            <>
              {detail.metadataError && <pre className="qx-sb-pre">{t('detail.metaError')}{'\n'}{detail.metadataError}</pre>}
              <pre className="qx-sb-pre">{detail.content}</pre>
              {detail.contentTruncated && <p className="qx-sb-truncated">{t('detail.truncated')}</p>}
              {detail.metadata !== undefined && <section className="qx-sb-detail-section"><h3>{t('detail.metadata')}</h3><pre className="qx-sb-pre">{metadataText(detail.metadata)}</pre></section>}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
