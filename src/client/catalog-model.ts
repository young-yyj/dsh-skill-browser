import {
  SKILL_CATEGORIES,
  type BrowserSkillSummary,
  type CategoryFilter,
} from '../contracts.ts'

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase()
}

function matchScore(skill: BrowserSkillSummary, query: string): number {
  const name = normalized(skill.name)
  if (name === query) return 400
  if (name.startsWith(query)) return 300
  if (name.includes(query)) return 200
  const fields = [
    skill.description,
    skill.whenToUse ?? '',
    skill.source,
    skill.provider,
    skill.category,
  ].join('\n').toLocaleLowerCase()
  return fields.includes(query) ? 100 : 0
}

export function filterSkills(
  skills: readonly BrowserSkillSummary[],
  rawQuery: string,
  category: CategoryFilter,
): BrowserSkillSummary[] {
  const query = normalized(rawQuery)
  return skills
    .filter(skill => category === 'all' || skill.category === category)
    .map(skill => ({ skill, score: query === '' ? 1 : matchScore(skill, query) }))
    .filter(row => row.score > 0)
    .sort((left, right) => right.score - left.score || left.skill.name.localeCompare(right.skill.name, 'en'))
    .map(row => row.skill)
}

export function categoryCounts(skills: readonly BrowserSkillSummary[]): Record<CategoryFilter, number> {
  const counts = Object.fromEntries([
    ['all', skills.length],
    ...SKILL_CATEGORIES.map(category => [category, 0]),
  ]) as Record<CategoryFilter, number>
  for (const skill of skills) counts[skill.category] += 1
  return counts
}
