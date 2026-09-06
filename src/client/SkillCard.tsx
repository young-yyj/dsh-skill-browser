import type { BrowserSkillSummary } from '../contracts.ts'
import { getSkillMetadata } from '../skill-metadata.ts'
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
  expanded: boolean
  onToggle: () => void
  selectedOutputs: string[]
  deliverableOnly: boolean
}

export function SkillCard({ skill, t, categoryLabel, onOpen, expanded, onToggle, selectedOutputs, deliverableOnly }: SkillCardProps): React.JSX.Element {
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
    >
      <div className="qx-sb-card-heading"><button type="button" className="qx-sb-card-name" onClick={() => onOpen(skill.name)}>{skill.name}</button><span className="qx-sb-category-tag">{categoryLabel}</span></div>
      <div className="qx-sb-card-body">
        <div className="qx-sb-io"><span>{l('适用于', 'Use for')}</span><div title={skill.metadataError}>{purpose}</div></div>
        <div className="qx-sb-io"><span>{l('输入', 'Input')}</span><div>{metadata?.required ?? l('待确认，请查看技能说明', 'Unconfirmed; see skill instructions')}</div></div>
        <div className="qx-sb-io"><span>{l('可选', 'Optional')}</span><div>{metadata?.optional ?? l('未标注', 'Unspecified')}</div></div>
        <div className="qx-sb-io"><span>{l('输出', 'Output')}</span><div className="qx-sb-output-tags">
          {metadata?.outputs.map(output => <span key={output.format} className={'qx-sb-format-tag' + (output.role === 'intermediate' ? ' qx-sb-intermediate' : '') + (selectedOutputs.includes(output.format) && (!deliverableOnly || output.role !== 'intermediate') ? ' qx-sb-matched' : '')}>{output.format}<small> · {roleLabels[output.role]}</small></span>) ?? l('格式待确认', 'Format unconfirmed')}
        </div></div>
      </div>
      <details open={expanded} className="qx-sb-card-conditions">
        <summary onClick={event => { event.preventDefault(); onToggle() }}>{expanded ? l('收起完整输入与适用条件', 'Collapse inputs and conditions') : l('查看完整输入与适用条件', 'View inputs and conditions')}</summary>
        <p>{metadata?.note ?? skill.whenToUse ?? skill.description}</p>
        {metadata && <p>{l('支持输入：', 'Supported inputs: ')}{metadata.inputs.join('、')}。{l('输出依任务选择，不表示每次全部生成。', 'Outputs depend on the task; not all are generated every time.')}</p>}
        <p>{sourceLabel} · {skill.provider} · {t(skill.userInvocable ? 'badge.user' : 'badge.notUser')}{skill.modelInvocable && ' · ' + t('badge.model')}</p>
        <button type="button" className="qx-sb-button" onClick={() => onOpen(skill.name)}>{l('查看原始 SKILL.md', 'View original SKILL.md')}</button>
      </details>
    </article>
  )
}
