import { describe, expect, it } from 'vitest'
import type { BrowserSkillSummary } from '../src/contracts.ts'
import { categoryCounts, filterSkills } from '../src/client/catalog-model.ts'

function skill(
  name: string,
  description: string,
  category: BrowserSkillSummary['category'],
  whenToUse?: string,
): BrowserSkillSummary {
  return {
    name,
    description,
    whenToUse,
    category,
    source: 'bundled',
    provider: 'filesystem',
    modelInvocable: true,
    userInvocable: true,
  }
}

const skills = [
  skill('pdf', 'PDF documents', 'documents'),
  skill('pdf-review', 'Review files', 'documents'),
  skill('research', 'Find PDF papers', 'research'),
  skill('writer', 'Long-form articles', 'research', 'Use for PDF summaries'),
]

describe('filterSkills', () => {
  it('orders exact, prefix, name inclusion, then other-field matches', () => {
    const withNameInclusion = [...skills, skill('my-pdf-tool', 'Other', 'development')]
    expect(filterSkills(withNameInclusion, ' PDF ', 'all').map(item => item.name))
      .toEqual(['pdf', 'pdf-review', 'my-pdf-tool', 'research', 'writer'])
  })

  it('intersects search with category', () => {
    expect(filterSkills(skills, 'pdf', 'research').map(item => item.name))
      .toEqual(['research', 'writer'])
  })

  it('sorts the unfiltered result by name without mutating input', () => {
    const original = [...skills]
    expect(filterSkills(skills, '', 'all').map(item => item.name))
      .toEqual(['pdf', 'pdf-review', 'research', 'writer'])
    expect(skills).toEqual(original)
  })

  it('matches source and provider fields', () => {
    expect(filterSkills(skills, 'bundled', 'all')).toHaveLength(4)
    expect(filterSkills(skills, 'filesystem', 'all')).toHaveLength(4)
  })
})

describe('categoryCounts', () => {
  it('counts every category and the total', () => {
    expect(categoryCounts(skills)).toMatchObject({
      all: 4,
      documents: 2,
      research: 2,
      other: 0,
    })
  })
})
