/** 仪表板：KPI 统计行 + 分类分布环形图 + 来源分布条形图。
 * 图表分段/条目可点击，直接驱动 explorer 的分类筛选。 */

import type { BrowserSkillSummary } from '../contracts.ts'
import { dashboardStatsOf } from './dashboard-model.ts'
import { DonutChart } from './DonutChart.tsx'
import { nameColorOf } from './nameColor.ts'
import type { SkillBrowserTranslate } from './SkillBrowser.tsx'
import type { SkillBrowserLocaleKey } from './locales.ts'

const SOURCE_KEYS: Partial<Record<string, SkillBrowserLocaleKey>> = {
  'project-dsh': 'source.projectDsh',
  'project-agents': 'source.projectAgents',
  custom: 'source.custom',
  runtime: 'source.runtime',
  'user-dsh': 'source.userDsh',
  'user-agents': 'source.userAgents',
  bundled: 'source.bundled',
  user: 'source.userDsh',
  project: 'source.projectDsh',
}

export interface DashboardProps {
  skills: BrowserSkillSummary[]
  activeCategory: string | null
  onCategorySelect: (category: string | null) => void
  t: SkillBrowserTranslate
}

export function Dashboard({ skills, activeCategory, onCategorySelect, t }: DashboardProps): React.JSX.Element {
  const english = t('category.all') === 'All'
  const l = (zhText: string, enText: string): string => english ? enText : zhText
  const fallbackCategory = l('其他', 'Other')
  const stats = dashboardStatsOf(skills, fallbackCategory)
  const sourceLabel = (source: string): string => {
    const key = SOURCE_KEYS[source]
    return key === undefined ? source : t(key)
  }
  const select = (label: string): void => {
    onCategorySelect(activeCategory === label ? null : label)
  }
  return (
    <section className="qx-sb-dashboard" aria-label={l('技能目录概览', 'Skill catalog overview')}>
      <div className="qx-sb-kpis">
        <div className="qx-sb-kpi"><span className="qx-sb-kpi-label">{l('技能总数', 'Total skills')}</span><span className="qx-sb-kpi-value" data-kpi="total">{stats.total}</span><span className="qx-sb-kpi-sub">{t('dialog.count', { count: stats.total })}</span></div>
        <div className="qx-sb-kpi"><span className="qx-sb-kpi-label">{l('可用户调用', 'User invocable')}</span><span className="qx-sb-kpi-value" data-kpi="user">{stats.userInvocable}</span><span className="qx-sb-kpi-sub">{l('斜杠 / 手动触发', 'Slash / manual trigger')}</span></div>
        <div className="qx-sb-kpi"><span className="qx-sb-kpi-label">{l('可模型调用', 'Model invocable')}</span><span className="qx-sb-kpi-value" data-kpi="model">{stats.modelInvocable}</span><span className="qx-sb-kpi-sub">{l('自动触发', 'Automatic trigger')}</span></div>
        <div className="qx-sb-kpi"><span className="qx-sb-kpi-label">{l('分类', 'Categories')}</span><span className="qx-sb-kpi-value" data-kpi="categories">{stats.categories.length}</span><span className="qx-sb-kpi-sub">{l('用途分组', 'Purpose groups')}</span></div>
        <div className="qx-sb-kpi"><span className="qx-sb-kpi-label">{l('元数据完备', 'Metadata ready')}</span><span className="qx-sb-kpi-value" data-kpi="ready">{stats.metadataReady}</span><span className="qx-sb-kpi-sub">{l('含用途与输出标注', 'Purpose and outputs labeled')}</span></div>
      </div>
      <div className="qx-sb-charts">
        <div className="qx-sb-chart-card">
          <h3 className="qx-sb-chart-title">{l('分类分布', 'By category')}{activeCategory && <button type="button" className="qx-sb-donut-clear" data-donut-clear="" onClick={() => onCategorySelect(null)}>{activeCategory} ×</button>}</h3>
          <div className="qx-sb-chart-body">
            <DonutChart
              segments={stats.categories.map(bucket => ({ key: bucket.label, color: nameColorOf(bucket.label), value: bucket.value }))}
              centerTop={String(stats.total)}
              centerSub={l('技能', 'skills')}
              activeKey={activeCategory}
              onSegmentClick={select}
              clearLabel={l('点击筛选该分类', 'Click to filter')}
            />
            <ul className="qx-sb-legend" role="list">
              {stats.categories.map(bucket => (
                <li key={bucket.key}>
                  <button
                    type="button"
                    className={'qx-sb-legend-row' + (activeCategory === bucket.label ? ' qx-sb-legend-on' : '')}
                    aria-pressed={activeCategory === bucket.label}
                    onClick={() => select(bucket.label)}
                  >
                    <i className="qx-sb-swatch" style={{ background: nameColorOf(bucket.label) }} aria-hidden="true" />
                    <span className="qx-sb-legend-label">{bucket.label}</span>
                    <span className="qx-sb-legend-value">{bucket.value}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="qx-sb-chart-card">
          <h3 className="qx-sb-chart-title">{l('来源分布', 'By source')}</h3>
          <ul className="qx-sb-bars" role="list">
            {stats.sources.map(bucket => {
              const width = stats.total > 0 ? Math.max(2, Math.round(bucket.value / stats.total * 100)) : 2
              return (
                <li key={bucket.key} className="qx-sb-bar-row">
                  <span className="qx-sb-bar-label" title={bucket.label}>{sourceLabel(bucket.key)}</span>
                  <span className="qx-sb-bar-track" aria-hidden="true">
                    <span className="qx-sb-bar-fill" style={{ width: `${width}%`, background: nameColorOf(bucket.key) }} />
                  </span>
                  <span className="qx-sb-legend-value">{bucket.value}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
