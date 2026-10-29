/** 概览条数据派生：仅依赖 BrowserSkillSummary[]，不触碰 host 接口。
 * 首屏以单行概览替代统计卡与图表；唯一可行动信号是"待补元数据"计数（可点击筛选）。 */

import type { BrowserSkillSummary } from '../contracts.ts'
import { getSkillMetadata } from '../skill-metadata.ts'

export interface OverviewStats {
  total: number
  categories: number
  sources: number
  metadataReady: number
  /** 审核元数据缺失（或解析失败）的技能名列表——可点击筛选的依据。 */
  pendingReview: string[]
  /** 条件化显示：同一维度只有一个值时，统计没有信息量。 */
  singleSource: boolean
}

export function overviewStatsOf(skills: readonly BrowserSkillSummary[]): OverviewStats {
  const categories = new Set<string>()
  const sources = new Set<string>()
  const pendingReview: string[] = []
  for (const skill of skills) {
    const metadata = getSkillMetadata(skill.name)
    categories.add(metadata?.category ?? 'other')
    sources.add(skill.source)
    if (skill.metadataError || metadata === undefined) pendingReview.push(skill.name)
  }
  return {
    total: skills.length,
    categories: categories.size,
    sources: sources.size,
    metadataReady: skills.length - pendingReview.length,
    pendingReview,
    singleSource: sources.size <= 1,
  }
}
