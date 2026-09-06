import { describe, expect, it } from 'vitest'
import type { BrowserSkillSummary } from '../src/contracts.ts'
import { BROWSER_CATEGORIES, getSkillMetadata } from '../src/skill-metadata.ts'
import { DEFAULT_FILTERS, filterCatalog, type FilterState } from '../src/client/skill-filters.ts'

const skill = (name: string, extra: Partial<BrowserSkillSummary> = {}): BrowserSkillSummary => ({
  name, description: '', source: 'dsh-home', provider: 'local', category: 'other',
  modelInvocable: true, userInvocable: true, ...extra,
})
const catalog = ['frontend-design', 'gzh-design', 'docx', 'theme-factory', 'hv-analysis', 'agent-browser', 'unknown'].map(name => skill(name))
const find = (overrides: Partial<FilterState>) => filterCatalog(catalog, { ...DEFAULT_FILTERS, ...overrides }).map(s => s.name)

describe('reviewed skill metadata', () => {
  it('retains the ten approved categories and explicit output roles', () => {
    expect(BROWSER_CATEGORIES).toHaveLength(10)
    expect(getSkillMetadata('docx')?.outputs).toContainEqual({ format: 'PDF', role: 'intermediate' })
    expect(getSkillMetadata('gzh-design')?.outputs).toContainEqual({ format: 'HTML', role: 'primary' })
    expect(getSkillMetadata('unknown')).toBeUndefined()
    expect(getSkillMetadata('constructor')).toBeUndefined()
  })
})

describe('catalog capability filters', () => {
  it('keeps the full catalog by default without mutating it', () => {
    expect(find({})).toEqual(catalog.map(s => s.name))
    expect(filterCatalog(catalog, DEFAULT_FILTERS)).not.toBe(catalog)
  })
  it('matches contained formats and ranks primary delivery first', () => {
    expect(find({ outputs: ['HTML'] })).toEqual(['gzh-design', 'frontend-design', 'theme-factory', 'hv-analysis'])
    expect(find({ outputs: ['HTML'], deliverableOnly: true })).toEqual(['gzh-design', 'frontend-design', 'theme-factory'])
  })
  it('supports any and all within outputs', () => {
    expect(find({ outputs: ['HTML', 'DOCX'], mode: 'all' })).toEqual(['theme-factory'])
    expect(find({ outputs: ['HTML', 'DOCX'], mode: 'any' })).toContain('docx')
  })
  it('excludes intermediate formats only when requested', () => {
    expect(find({ outputs: ['PDF'] })).toEqual(['hv-analysis', 'docx'])
    expect(find({ outputs: ['PDF'], deliverableOnly: true })).toEqual(['hv-analysis'])
  })
  it('ANDs groups and ORs input alternatives', () => {
    expect(find({ outputs: ['HTML'], inputs: ['Markdown', 'Qt TS'], category: '写作与公众号' })).toEqual(['gzh-design'])
    expect(find({ outputs: ['HTML'], noUpload: true })).toEqual(['gzh-design', 'frontend-design', 'hv-analysis'])
  })
  it('does not guess unknown formats or reuse legacy categories', () => {
    expect(find({ category: '其他' })).toEqual(['unknown'])
    expect(find({ outputs: ['PNG'] })).not.toContain('agent-browser')
  })
  it('searches names, descriptions, applicability, sources and providers case insensitively', () => {
    for (const field of ['name', 'description', 'whenToUse', 'source', 'provider'] as const) {
      const item = skill('unknown', { [field]: 'UniqueNeedle' })
      expect(filterCatalog([item], { ...DEFAULT_FILTERS, query: ' uniqueneedle ' })).toEqual([item])
    }
  })
})
