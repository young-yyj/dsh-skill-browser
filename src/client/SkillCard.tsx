/** 技能卡片:整卡可点打开详情弹窗;信息保留"适用于/输入/输出"三行概览。 */

import type { BrowserSkillSummary } from '../contracts.ts'
import { getSkillMetadata } from '../skill-metadata.ts'
import { nameColorOf } from './nameColor.ts'
import type { SkillBrowserTranslate } from './SkillBrowser.tsx'
import type { SkillBrowserLocaleKey } from './locales.ts'

const SOURCE_LABELS: Partial<Record<string, SkillBrowserLocaleKey>> = {
  'project-dsh': 'source.projectDsh',
  'project-agents': 'source.projectAgents',
  custom: 'source.custom',
  runtime: 'source.runtime',
  'user-dsh': 'source.userDsh',
  'user-agents': 'source.userAgents',
  bundled: 'source.bundled',
}

export interface SkillCardProps {
  skill: BrowserSkillSummary
  t: SkillBrowserTranslate
  categoryLabel: string
  onOpen: (name: string) => void
  selectedOutputs: string[]
  deliverableOnly: boolean
}

export function SkillCard({ skill, t, categoryLabel, onOpen, selectedOutputs, deliverableOnly }: SkillCardProps): React.JSX.Element {
  const sourceKey = SOURCE_LABELS[skill.source]
  const sourceLabel = sourceKey === undefined ? skill.source : t(sourceKey)
  const metadata = getSkillMetadata(skill.name)
  const l = (zh: string, en: string): string => t('category.all') === 'All' ? en : zh
  const roleLabels = { primary: l('主要交付', 'Main output'), optional: l('按需输出', 'On demand'), intermediate: l('中间 / 预览', 'Intermediate / preview'), result: l('执行结果', 'Action result') }
  const purpose = skill.metadataError ? t('status.metadataError') : !skill.description.trim() ? t('status.noDescription') : metadata?.purpose ?? skill.description
  return (
    <article
      className="qx-sb-card"
      data-skill-card={skill.name}
      style={{ '--qxsb-accent': nameColorOf(skill.name) } as React.CSSProperties}
      onClick={() => onOpen(skill.name)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen(skill.name)
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={skill.name + ' · ' + l('查看详情', 'View detail')}
    >
      <div className="qx-sb-card-heading"><span className="qx-sb-card-name">{skill.name}</span><span className="qx-sb-category-tag" style={{ '--qxsb-accent': nameColorOf(categoryLabel) } as React.CSSProperties}>{categoryLabel}</span></div>
      <div className="qx-sb-card-body">
        <div className="qx-sb-io"><span>{l('适用于', 'Use for')}</span><div title={skill.metadataError}>{purpose}</div></div>
        <div className="qx-sb-io"><span>{l('输入', 'Input')}</span><div>{metadata?.required ?? l('待确认，请查看技能说明', 'Unconfirmed; see skill instructions')}</div></div>
        <div className="qx-sb-io"><span>{l('输出', 'Output')}</span><div className="qx-sb-output-tags">
          {metadata?.outputs.map(output => <span key={output.format} className={'qx-sb-format-tag' + (output.role === 'intermediate' ? ' qx-sb-intermediate' : '') + (selectedOutputs.includes(output.format) && (!deliverableOnly || output.role !== 'intermediate') ? ' qx-sb-matched' : '')}>{output.format}<small> · {roleLabels[output.role]}</small></span>) ?? l('格式待确认', 'Format unconfirmed')}
        </div></div>
      </div>
      <div className="qx-sb-card-footer"><span>{sourceLabel} · {skill.provider}</span><span>{t(skill.userInvocable ? 'badge.user' : 'badge.notUser')}{skill.modelInvocable && ' · ' + t('badge.model')}</span></div>
    </article>
  )
}
