import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-agent'
import { resolveSessionPreset } from '@deepseek-ai/dsh-agent-presets'
import type {} from '@deepseek-ai/dsh-agent-presets/types'
import { SessionId } from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-session-query'
import { SessionQueryError } from '@deepseek-ai/dsh-session-query'
import type { ScopeKey } from '@deepseek-ai/dsh-scope'
import type { SkillRegistry } from '@deepseek-ai/dsh-skill'

export class SessionSkillViewError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'SessionSkillViewError'
  }
}

export interface SessionSkillView {
  cwd: string
  scope?: ScopeKey
  registry: SkillRegistry
}

export async function resolveSessionSkillView(
  ctx: Context,
  sessionId: string,
): Promise<SessionSkillView> {
  const resolvedSessionId = SessionId(sessionId)
  let snapshot: Awaited<ReturnType<Context['sessionQuery']['readSession']>>
  try {
    snapshot = await ctx.sessionQuery.readSession(resolvedSessionId)
  } catch (error) {
    if (!(error instanceof SessionQueryError)
      || error.code !== 'SESSION_QUERY_SESSION_NOT_FOUND') {
      throw new SessionSkillViewError(
        'session/unavailable',
        `session "${sessionId}" could not be read`,
      )
    }
    throw new SessionSkillViewError(
      'session/not-found',
      `session "${sessionId}" is unavailable`,
    )
  }

  const cwd = snapshot.session.cwd
  if (cwd === undefined || cwd === '') {
    throw new SessionSkillViewError(
      'session/no-cwd',
      `session "${sessionId}" has no workspace`,
    )
  }

  const live = ctx.agents.get(resolvedSessionId)
  const presets = ctx.get('agentPresets')
  let scope: ScopeKey | undefined = live
  let registry = live === undefined ? undefined : presets?.serviceFor(live, 'skills')

  if (live === undefined && presets !== undefined) {
    try {
      const preset = resolveSessionPreset({
        header: snapshot.session,
        events: snapshot.events,
      })
      scope = await presets.standingKeyFor(preset)
    } catch {
      throw new SessionSkillViewError(
        'session/scope-unavailable',
        `session "${sessionId}" skill scope is unavailable`,
      )
    }
  }

  registry ??= ctx.get('skills')
  if (registry === undefined) {
    throw new SessionSkillViewError(
      'skills/unavailable',
      'the skill registry is unavailable',
    )
  }

  return { cwd, scope, registry }
}
