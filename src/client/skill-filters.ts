import type { BrowserSkillSummary } from '../contracts.ts'
import { getSkillMetadata } from '../skill-metadata.ts'

export interface FilterState {
  category: string
  query: string
  outputs: string[]
  inputs: string[]
  mode: 'any' | 'all'
  deliverableOnly: boolean
  noUpload: boolean
}

export const DEFAULT_FILTERS: FilterState = {
  category: 'all', query: '', outputs: [], inputs: [], mode: 'any',
  deliverableOnly: false, noUpload: false,
}

export function filterCatalog(skills: readonly BrowserSkillSummary[], filters: FilterState): BrowserSkillSummary[] {
  const query = filters.query.trim().toLowerCase()
  const matches = skills.flatMap((skill, index) => {
    const metadata = getSkillMetadata(skill.name)
    if (filters.category !== 'all' && filters.category && filters.category !== (metadata?.category ?? '其他')) return []
    const searchable = [skill.name, skill.description, skill.whenToUse, skill.source, skill.provider,
      metadata?.purpose, metadata?.category, metadata?.required, metadata?.optional, metadata?.note,
      ...(metadata?.inputs ?? []), ...(metadata?.outputs.map(output => output.format) ?? [])]
    if (query && !searchable.join(' ').toLowerCase().includes(query)) return []
    if (filters.noUpload && metadata?.noUpload !== true) return []
    if (filters.inputs.length && !filters.inputs.some(input => metadata?.inputs.includes(input))) return []
    const outputs = (metadata?.outputs ?? []).filter(output => !filters.deliverableOnly || output.role !== 'intermediate')
    const hasOutput = (format: string) => outputs.some(output => output.format === format)
    if (filters.outputs.length && !(filters.mode === 'all' ? filters.outputs.every(hasOutput) : filters.outputs.some(hasOutput))) return []
    const selected = outputs.filter(output => filters.outputs.includes(output.format))
    const rank = selected.length ? Math.min(...selected.map(output => output.role === 'primary' ? 0 : output.role === 'intermediate' ? 2 : 1)) : 0
    return [{ skill, rank, index }]
  })
  return matches.sort((a, b) => a.rank - b.rank || a.index - b.index).map(match => match.skill)
}
