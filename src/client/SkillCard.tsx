import type { BrowserSkillSummary, SkillCategory } from '../contracts.ts'
import type { SkillBrowserTranslate } from './SkillBrowser.tsx'
import type { SkillBrowserLocaleKey } from './locales.ts'

const CATEGORY_ICONS: Record<SkillCategory, string> = {
  dsh: '🧰', development: '🧑‍💻', documents: '📄', spreadsheets: '📊',
  data: '📈', research: '🔍', design: '🎨', visual: '🖼️', media: '🎬',
  system: '🖥️', collaboration: '🤖', governance: '🏷️', lifestyle: '🎈', other: '🧩',
}

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
}

export function SkillCard({ skill, t, categoryLabel, onOpen }: SkillCardProps): React.JSX.Element {
  const sourceKey = SOURCE_LABELS[skill.source]
  const sourceLabel = sourceKey === undefined ? skill.source : t(sourceKey)
  return (
    <button
      type="button"
      className="qx-sb-card"
      data-skill-card={skill.name}
      onClick={() => onOpen(skill.name)}
    >
      <span className="qx-sb-card-name">{skill.name}</span>
      <span className="qx-sb-card-desc">{skill.description}</span>
      {skill.whenToUse && <span className="qx-sb-card-use">{skill.whenToUse}</span>}
      <span className="qx-sb-card-footer">
        <span>{CATEGORY_ICONS[skill.category]} {categoryLabel} · {sourceLabel}</span>
        <span className="qx-sb-tags">
          {skill.modelInvocable && <span className="qx-sb-tag">{t('badge.model')}</span>}
          <span className="qx-sb-tag">{t(skill.userInvocable ? 'badge.user' : 'badge.notUser')}</span>
        </span>
      </span>
    </button>
  )
}
