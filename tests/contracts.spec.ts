import { describe, expect, it } from 'vitest'
import { isCatalogResponse, isSkillDetailResponse, isSkillName } from '../src/contracts.ts'

describe('skill contracts', () => {
  it.each([
    ['frontend-design', true],
    ['a', true],
    ['two--parts', false],
    ['Frontend-Design', false],
    ['../settings', false],
    ['ends-', false],
    ['', false],
    ['a'.repeat(129), false],
  ])('validates the public skill name %j', (name, expected) => {
    expect(isSkillName(name)).toBe(expected)
  })

  it('accepts a complete bounded catalog payload', () => {
    expect(isCatalogResponse({
      revision: 3,
      complete: true,
      generatedAt: '2026-09-03T00:00:00.000Z',
      cwd: 'C:/work/project',
      skills: [{
        name: 'pdf',
        description: 'Work with PDF documents',
        source: 'user-dsh',
        provider: 'filesystem',
        modelInvocable: true,
        userInvocable: true,
        category: 'documents',
      }],
    })).toBe(true)
  })

  it.each([
    { revision: 1, complete: true, generatedAt: 'now', cwd: 'C:/work', skills: 'wrong' },
    { revision: -1, complete: true, generatedAt: 'now', cwd: 'C:/work', skills: [] },
    { revision: 1, complete: 'yes', generatedAt: 'now', cwd: 'C:/work', skills: [] },
    { revision: 1, complete: true, generatedAt: 'now', cwd: 'C:/work', skills: [{ name: '../bad' }] },
  ])('rejects malformed catalog payloads', payload => {
    expect(isCatalogResponse(payload)).toBe(false)
  })

  it('validates a complete detail payload', () => {
    expect(isSkillDetailResponse({
      name: 'pdf',
      description: 'PDF documents',
      source: 'bundled',
      provider: 'filesystem',
      modelInvocable: true,
      userInvocable: true,
      category: 'documents',
      content: '# PDF',
      contentTruncated: false,
    })).toBe(true)
    expect(isSkillDetailResponse({ name: 'pdf', content: 3 })).toBe(false)
  })
})
