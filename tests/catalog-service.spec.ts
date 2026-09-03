import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MAX_CONTENT_CHARS,
  MAX_LABEL_CHARS,
  MAX_PATH_CHARS,
  MAX_SKILLS,
} from '../src/contracts.ts'
import { CatalogService } from '../src/host/catalog-service.ts'
import { sanitizeMetadata } from '../src/host/sanitize.ts'

function summary(overrides: Record<string, unknown> = {}) {
  return {
    name: 'xlsx',
    description: 'Excel workbooks',
    source: 'user-dsh',
    provider: 'filesystem',
    invocation: { modelInvocable: true, userInvocable: true },
    resourceBase: { kind: 'directory', path: 'C:/skills/xlsx' },
    ...overrides,
  }
}

describe('CatalogService', () => {
  const scope = { agentPreset: 'standard' }
  const registry = {
    snapshot: vi.fn(),
    get: vi.fn(),
  }
  const resolver = vi.fn(async () => ({ cwd: 'C:/work/project', scope, registry }))
  let service: CatalogService

  beforeEach(() => {
    registry.snapshot.mockReset()
    registry.get.mockReset()
    resolver.mockClear()
    service = new CatalogService({} as never, resolver as never, () => new Date('2026-09-03T01:00:00.000Z'))
  })

  it('lists winning summaries with source, provider, category and completeness', async () => {
    registry.snapshot.mockResolvedValue({ complete: false, skills: [summary()] })
    await expect(service.list('session-1')).resolves.toEqual({
      revision: 0,
      complete: false,
      generatedAt: '2026-09-03T01:00:00.000Z',
      cwd: 'C:/work/project',
      skills: [{
        name: 'xlsx',
        description: 'Excel workbooks',
        source: 'user-dsh',
        provider: 'filesystem',
        modelInvocable: true,
        userInvocable: true,
        category: 'spreadsheets',
        resourceBase: { kind: 'directory', value: 'C:/skills/xlsx' },
      }],
    })
    expect(registry.snapshot).toHaveBeenCalledWith({ cwd: 'C:/work/project', scope })
  })

  it('increments a monotonic revision only when invalidated', async () => {
    registry.snapshot.mockResolvedValue({ complete: true, skills: [] })
    expect(service.invalidate()).toBe(1)
    expect(service.invalidate()).toBe(2)
    await expect(service.list('session-1')).resolves.toMatchObject({ revision: 2 })
  })

  it('does not load an unknown detail name', async () => {
    registry.snapshot.mockResolvedValue({ complete: true, skills: [] })
    await expect(service.detail('session-1', 'missing')).rejects.toMatchObject({
      code: 'skill/not-found',
    })
    expect(registry.get).not.toHaveBeenCalled()
  })

  it('loads a winning definition and truncates an oversized body', async () => {
    const body = 'x'.repeat(MAX_CONTENT_CHARS + 20)
    registry.snapshot.mockResolvedValue({ complete: true, skills: [summary()] })
    registry.get.mockResolvedValue({
      ...summary(),
      path: 'C:/skills/xlsx/SKILL.md',
      metadata: { owner: 'local' },
      content: body,
    })
    const detail = await service.detail('session-1', 'xlsx')
    expect(detail).toMatchObject({
      name: 'xlsx',
      path: 'C:/skills/xlsx/SKILL.md',
      metadata: { owner: 'local' },
      contentTruncated: true,
    })
    expect(detail.content).toHaveLength(MAX_CONTENT_CHARS)
    expect(registry.get).toHaveBeenCalledWith('xlsx', { cwd: 'C:/work/project', scope })
  })

  it('reports a disappearing winning definition as unavailable', async () => {
    registry.snapshot.mockResolvedValue({ complete: true, skills: [summary()] })
    registry.get.mockResolvedValue(undefined)
    await expect(service.detail('session-1', 'xlsx')).rejects.toMatchObject({
      code: 'skill/not-found',
    })
  })

  it('bounds every server-controlled list field and marks an oversized catalog incomplete', async () => {
    const oversized = summary({
      source: 's'.repeat(MAX_LABEL_CHARS + 10),
      provider: 'p'.repeat(MAX_LABEL_CHARS + 10),
      resourceBase: { kind: 'directory', path: 'r'.repeat(MAX_PATH_CHARS + 10) },
    })
    registry.snapshot.mockResolvedValue({
      complete: true,
      skills: Array.from({ length: MAX_SKILLS + 1 }, () => oversized),
    })

    const result = await service.list('session-1')
    expect(result.complete).toBe(false)
    expect(result.skills).toHaveLength(MAX_SKILLS)
    expect(result.skills[0]?.source).toHaveLength(MAX_LABEL_CHARS)
    expect(result.skills[0]?.provider).toHaveLength(MAX_LABEL_CHARS)
    expect(result.skills[0]?.resourceBase?.value).toHaveLength(MAX_PATH_CHARS)
  })

  it('bounds detail paths and rejects invalid registry skill names', async () => {
    registry.snapshot.mockResolvedValue({ complete: true, skills: [summary()] })
    registry.get.mockResolvedValue({
      ...summary(),
      path: 'x'.repeat(MAX_PATH_CHARS + 10),
      content: 'body',
    })
    await expect(service.detail('session-1', 'xlsx')).resolves.toMatchObject({
      path: 'x'.repeat(MAX_PATH_CHARS),
    })

    registry.snapshot.mockResolvedValue({ complete: true, skills: [summary({ name: '../bad' })] })
    await expect(service.list('session-1')).rejects.toMatchObject({ code: 'skill/invalid' })
  })
})

describe('sanitizeMetadata', () => {
  it('keeps JSON primitives while dropping unsafe and executable properties', () => {
    const input = Object.create(null) as Record<string, unknown>
    input.safe = { value: 3, enabled: true, nothing: null }
    input.fn = () => 'nope'
    Object.defineProperty(input, 'computed', { enumerable: true, get: () => 'nope' })
    Object.defineProperty(input, '__proto__', { enumerable: true, value: { polluted: true } })
    expect(sanitizeMetadata(input)).toEqual({
      safe: { value: 3, enabled: true, nothing: null },
    })
  })

  it('bounds strings, arrays, depth, cycles and total serialized size', () => {
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic
    expect(sanitizeMetadata({ long: 'x'.repeat(20_000) })).toEqual({
      long: 'x'.repeat(16_384),
    })
    expect(sanitizeMetadata({ many: Array.from({ length: 300 }, (_, index) => index) }))
      .toEqual({ many: Array.from({ length: 256 }, (_, index) => index) })
    expect(JSON.stringify(sanitizeMetadata(cyclic))).toContain('cycle')
    expect(sanitizeMetadata({ huge: Array.from({ length: 10 }, () => 'x'.repeat(16_384)) }))
      .toBe('[metadata omitted: limit exceeded]')
  })
})
