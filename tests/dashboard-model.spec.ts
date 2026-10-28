import { describe, expect, it } from 'vitest'
import type { BrowserSkillSummary } from '../src/contracts.ts'
import { dashboardStatsOf } from '../src/client/dashboard-model.ts'
import { paletteIndexOf, nameColorOf } from '../src/client/nameColor.ts'

function skill(partial: Partial<BrowserSkillSummary> & { name: string }): BrowserSkillSummary {
  return {
    description: '',
    source: 'user',
    provider: 'filesystem',
    modelInvocable: true,
    userInvocable: true,
    category: 'other',
    ...partial,
  }
}

describe('nameColor', () => {
  it('is deterministic and within the palette', () => {
    expect(paletteIndexOf('pdf')).toBe(paletteIndexOf('pdf'))
    expect(paletteIndexOf('pdf')).toBeGreaterThanOrEqual(0)
    expect(paletteIndexOf('pdf')).toBeLessThan(8)
    expect(nameColorOf('pdf')).toMatch(/^var\(--qxsb-c[1-8], #/)
  })

  it('spreads distinct names across the palette', () => {
    const indexes = new Set(['pdf', 'agent-browser', 'frontend-design'].map(paletteIndexOf))
    expect(indexes.size).toBeGreaterThan(1)
  })
})

describe('dashboardStatsOf', () => {
  it('derives KPI counts, category buckets and source buckets', () => {
    const stats = dashboardStatsOf([
      skill({ name: 'pdf', category: 'documents' }),
      skill({ name: 'agent-browser', category: 'system', userInvocable: false }),
      skill({ name: 'frontend-design', category: 'design' }),
      skill({ name: 'no-meta', category: 'other', metadataError: 'bad' }),
    ], '其他')
    expect(stats.total).toBe(4)
    expect(stats.userInvocable).toBe(3)
    expect(stats.modelInvocable).toBe(4)
    expect(stats.metadataReady).toBe(3)
    expect(stats.sources).toEqual([
      { key: 'user', label: 'user', value: 4 },
    ])
    const labels = stats.categories.map(bucket => bucket.label)
    expect(labels).toEqual(expect.arrayContaining(['办公文件', '自动化与实用工具', '界面与视觉设计', '其他']))
    const others = stats.categories.find(bucket => bucket.label === '其他')
    expect(others?.value).toBe(1)
  })

  it('handles an empty catalog', () => {
    const stats = dashboardStatsOf([], '其他')
    expect(stats.total).toBe(0)
    expect(stats.categories).toEqual([])
    expect(stats.sources).toEqual([])
  })
})
