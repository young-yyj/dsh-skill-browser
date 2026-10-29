import { describe, expect, it } from 'vitest'
import type { BrowserSkillSummary } from '../src/contracts.ts'
import { overviewStatsOf } from '../src/client/dashboard-model.ts'
import { paletteIndexOf, nameColorOf } from '../src/client/nameColor.ts'

function skill(partial: Partial<BrowserSkillSummary> & { name: string }): BrowserSkillSummary {
  return {
    description: '',
    source: 'user-dsh',
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

describe('overviewStatsOf', () => {
  it('derives totals, category/source diversity and pending review list', () => {
    const stats = overviewStatsOf([
      skill({ name: 'pdf' }),
      skill({ name: 'agent-browser', source: 'bundled' }),
      skill({ name: 'frontend-design' }),
      skill({ name: 'no-meta', metadataError: 'bad' }),
      skill({ name: 'also-no-meta' }),
    ])
    expect(stats.total).toBe(5)
    expect(stats.categories).toBeGreaterThan(0)
    expect(stats.sources).toBe(2)
    expect(stats.singleSource).toBe(false)
    expect(stats.metadataReady).toBe(3)
    expect(stats.pendingReview).toEqual(['no-meta', 'also-no-meta'])
  })

  it('flags a single-source catalog and an empty one', () => {
    const single = overviewStatsOf([skill({ name: 'pdf' })])
    expect(single.singleSource).toBe(true)
    const empty = overviewStatsOf([])
    expect(empty.total).toBe(0)
    expect(empty.pendingReview).toEqual([])
    expect(empty.singleSource).toBe(true)
  })
})
