/** 概览条：单行小字给出目录全貌；"待补元数据"是唯一可行动信号，点击即筛选。
 * 旧的 KPI 卡与分布图表已移除——它们重复了筛选 pills 的信息且不可行动。 */

import type { BrowserSkillSummary } from '../contracts.ts'
import { overviewStatsOf } from './dashboard-model.ts'
import type { SkillBrowserTranslate } from './SkillBrowser.tsx'

export interface DashboardProps {
  skills: BrowserSkillSummary[]
  /** "待补元数据"筛选是否激活。 */
  pendingActive: boolean
  onPendingToggle: () => void
  t: SkillBrowserTranslate
}

export function Dashboard({ skills, pendingActive, onPendingToggle, t }: DashboardProps): React.JSX.Element {
  const english = t('category.all') === 'All'
  const l = (zhText: string, enText: string): string => english ? enText : zhText
  const stats = overviewStatsOf(skills)
  return (
    <div className="qx-sb-overview" data-overview="" aria-label={l('技能目录概览', 'Skill catalog overview')}>
      <span className="qx-sb-overview-item"><b>{stats.total}</b> {l('个技能', 'skills')}</span>
      <span className="qx-sb-overview-sep" aria-hidden="true">·</span>
      <span className="qx-sb-overview-item"><b>{stats.categories}</b> {l('个分类', 'categories')}</span>
      {!stats.singleSource && (
        <>
          <span className="qx-sb-overview-sep" aria-hidden="true">·</span>
          <span className="qx-sb-overview-item"><b>{stats.sources}</b> {l('个来源', 'sources')}</span>
        </>
      )}
      {stats.pendingReview.length > 0 && (
        <>
          <span className="qx-sb-overview-sep" aria-hidden="true">·</span>
          <button
            type="button"
            className="qx-sb-overview-pending"
            aria-pressed={pendingActive}
            onClick={onPendingToggle}
            title={l('筛选出缺审核元数据（用途/输入/输出标注）的技能', 'Filter skills missing curated metadata (purpose/input/output labels)')}
          >
            <b>{stats.pendingReview.length}</b> {l('个待补元数据', 'pending metadata')}
          </button>
        </>
      )}
    </div>
  )
}
