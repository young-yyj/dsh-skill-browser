import { describe, expect, it, vi } from 'vitest'
import { SessionQueryError } from '@deepseek-ai/dsh-session-query'
import { resolveSessionSkillView } from '../src/host/session-skill-view.ts'

function session(cwd: string | null = 'C:/work/project', preset = 'standard') {
  return {
    session: { ...(cwd === null ? {} : { cwd }), agentPreset: preset },
    events: [],
  }
}

function context(options: {
  session?: ReturnType<typeof session>
  live?: object
  scopedRegistry?: object
  globalRegistry?: object
  standingScope?: object
  readError?: Error
} = {}) {
  const globalRegistry = options.globalRegistry ?? { snapshot: vi.fn(), get: vi.fn() }
  const standingScope = options.standingScope ?? { agentPreset: 'standard' }
  const presets = {
    serviceFor: vi.fn(() => options.scopedRegistry),
    standingKeyFor: vi.fn(async () => standingScope),
  }
  const ctx = {
    sessionQuery: {
      readSession: options.readError === undefined
        ? vi.fn(async () => options.session ?? session())
        : vi.fn(async () => { throw options.readError }),
    },
    agents: { get: vi.fn(() => options.live) },
    get: vi.fn((key: string) => {
      if (key === 'agentPresets') return presets
      if (key === 'skills') return globalRegistry
      return undefined
    }),
  }
  return { ctx, presets, globalRegistry, standingScope }
}

describe('resolveSessionSkillView', () => {
  it('prefers the live preset skill service and live scope', async () => {
    const live = { id: 'session-1', ctx: {} }
    const scopedRegistry = { snapshot: vi.fn(), get: vi.fn() }
    const { ctx, presets } = context({ live, scopedRegistry })

    await expect(resolveSessionSkillView(ctx as never, 'session-1')).resolves.toMatchObject({
      cwd: 'C:/work/project',
      scope: live,
      registry: scopedRegistry,
    })
    expect(presets.serviceFor).toHaveBeenCalledWith(live, 'skills')
    expect(presets.standingKeyFor).not.toHaveBeenCalled()
  })

  it('uses the recorded preset standing scope for a cold session', async () => {
    const standingScope = { agentPreset: 'research' }
    const { ctx, presets, globalRegistry } = context({
      session: session('C:/cold', 'research'),
      standingScope,
    })

    await expect(resolveSessionSkillView(ctx as never, 'session-2')).resolves.toEqual({
      cwd: 'C:/cold',
      scope: standingScope,
      registry: globalRegistry,
    })
    expect(presets.standingKeyFor).toHaveBeenCalledWith('research')
    expect(presets.serviceFor).not.toHaveBeenCalled()
  })

  it('falls back to the host registry while preserving a live scope', async () => {
    const live = { id: 'session-3', ctx: {} }
    const { ctx, globalRegistry } = context({ live, scopedRegistry: undefined })
    await expect(resolveSessionSkillView(ctx as never, 'session-3')).resolves.toMatchObject({
      scope: live,
      registry: globalRegistry,
    })
  })

  it('fails visibly when the standing preset scope cannot be resolved', async () => {
    const { ctx, presets } = context()
    presets.standingKeyFor.mockRejectedValueOnce(new Error('missing preset'))
    await expect(resolveSessionSkillView(ctx as never, 'session-4')).rejects.toMatchObject({
      code: 'session/scope-unavailable',
    })
  })

  it('reports a session without a workspace', async () => {
    const { ctx } = context({
      session: session(null),
    })
    await expect(resolveSessionSkillView(ctx as never, 'session-5')).rejects.toMatchObject({
      code: 'session/no-cwd',
    })
  })

  it('keeps missing sessions distinct from persistence failures', async () => {
    const missing = context({
      readError: new SessionQueryError('missing', 'SESSION_QUERY_SESSION_NOT_FOUND'),
    })
    await expect(resolveSessionSkillView(missing.ctx as never, 'missing')).rejects.toMatchObject({
      code: 'session/not-found',
    })

    const { ctx } = context({ readError: new Error('persistence failed') })
    await expect(resolveSessionSkillView(ctx as never, 'missing')).rejects.toMatchObject({
      code: 'session/unavailable',
    })
  })

  it('reports an unavailable registry', async () => {
    const { ctx } = context({ globalRegistry: undefined })
    ctx.get = vi.fn((key: string) => key === 'agentPresets'
      ? { serviceFor: vi.fn(), standingKeyFor: vi.fn(async () => undefined) }
      : undefined)
    await expect(resolveSessionSkillView(ctx as never, 'session-6')).rejects.toMatchObject({
      code: 'skills/unavailable',
    })
  })
})
