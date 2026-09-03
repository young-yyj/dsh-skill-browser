import { describe, expect, it } from 'vitest'
import { classifySkill } from '../src/classifier.ts'

describe('classifySkill', () => {
  it.each([
    ['xlsx', 'Create Excel workbooks', undefined, 'spreadsheets'],
    ['docx', 'Edit Word documents', undefined, 'documents'],
    ['frontend-design', 'Build polished interfaces', undefined, 'design'],
    ['deepseek-tools', 'Harness extensions', undefined, 'dsh'],
    ['unknown-workflow', 'Unmapped capability', undefined, 'other'],
    ['neutral-name', 'Neutral description', 'Use when generating 海报', 'visual'],
  ])('classifies %s deterministically', (name, description, whenToUse, expected) => {
    expect(classifySkill({ name, description, whenToUse })).toBe(expected)
  })

  it('uses the first matching rule', () => {
    expect(classifySkill({ name: 'excel-dashboard', description: 'Data dashboard' }))
      .toBe('spreadsheets')
  })
})
