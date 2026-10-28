/** 仪表板数据派生：仅依赖 BrowserSkillSummary[]，不触碰 host 接口。
 * 分类用 skill-metadata 的审核分类(与筛选器一致)，无元数据时归入"其他"。 */

import type { BrowserSkillSummary } from '../contracts.ts'
import { getSkillMetadata } from '../skill-metadata.ts'

export interface Bucket {
  key: string
  label: string
  value: number
}

export interface DashboardStats {
  total: number
  userInvocable: number
  modelInvocable: number
  categories: Bucket[]
  sources: Bucket[]
  metadataReady: number
}

export function dashboardStatsOf(skills: readonly BrowserSkillSummary[], fallbackCategory: string): DashboardStats {
  const userInvocable = skills.filter(skill => skill.userInvocable).length
  const modelInvocable = skills.filter(skill => skill.modelInvocable).length
  const metadataReady = skills.filter(skill => !skill.metadataError && getSkillMetadata(skill.name) !== undefined).length

  const categoryCount = new Map<string, number>()
  for (const skill of skills) {
    const label = getSkillMetadata(skill.name)?.category ?? fallbackCategory
    categoryCount.set(label, (categoryCount.get(label) ?? 0) + 1)
  }
  const categories = [...categoryCount.entries()]
    .map(([label, value]) => ({ key: label, label, value }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label, 'zh'))

  const sourceCount = new Map<string, number>()
  for (const skill of skills) sourceCount.set(skill.source, (sourceCount.get(skill.source) ?? 0) + 1)
  const sources = [...sourceCount.entries()]
    .map(([key, value]) => ({ key, label: key, value }))
    .sort((left, right) => right.value - left.value || left.key.localeCompare(right.key, 'en'))

  return { total: skills.length, userInvocable, modelInvocable, categories, sources, metadataReady }
}
