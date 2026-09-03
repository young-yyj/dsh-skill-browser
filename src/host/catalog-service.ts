import type { Context } from '@deepseek-ai/cordis'
import type { SkillSummary } from '@deepseek-ai/dsh-skill'
import { classifySkill } from '../classifier.ts'
import {
  MAX_CONTENT_CHARS,
  MAX_DESCRIPTION_CHARS,
  MAX_LABEL_CHARS,
  MAX_PATH_CHARS,
  MAX_SKILLS,
  isSkillName,
  type BrowserSkillSummary,
  type CatalogResponse,
  type ResourceBaseDto,
  type SkillDetailResponse,
} from '../contracts.ts'
import { sanitizeMetadata } from './sanitize.ts'
import {
  resolveSessionSkillView,
  type SessionSkillView,
} from './session-skill-view.ts'

export class CatalogError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'CatalogError'
  }
}

export type SessionSkillResolver = (
  ctx: Context,
  sessionId: string,
) => Promise<SessionSkillView>

function resourceBaseDto(skill: SkillSummary): ResourceBaseDto | undefined {
  const base = skill.resourceBase
  if (base === undefined) return undefined
  if (base.kind === 'directory') return { kind: base.kind, value: base.path.slice(0, MAX_PATH_CHARS) }
  if (base.kind === 'url') return { kind: base.kind, value: base.url.slice(0, MAX_PATH_CHARS) }
  return { kind: base.kind, value: base.description.slice(0, MAX_PATH_CHARS) }
}

function summaryDto(skill: SkillSummary): BrowserSkillSummary {
  if (!isSkillName(skill.name)) {
    throw new CatalogError('skill/invalid', 'the skill registry returned an invalid skill name')
  }
  const resourceBase = resourceBaseDto(skill)
  return {
    name: skill.name,
    description: skill.description.slice(0, MAX_DESCRIPTION_CHARS),
    ...(skill.whenToUse === undefined
      ? {}
      : { whenToUse: skill.whenToUse.slice(0, MAX_DESCRIPTION_CHARS) }),
    source: skill.source.slice(0, MAX_LABEL_CHARS),
    provider: skill.provider.slice(0, MAX_LABEL_CHARS),
    modelInvocable: skill.invocation.modelInvocable,
    userInvocable: skill.invocation.userInvocable,
    category: classifySkill(skill),
    ...(resourceBase === undefined ? {} : { resourceBase }),
  }
}

export class CatalogService {
  private revision = 0

  constructor(
    private readonly ctx: Context,
    private readonly resolver: SessionSkillResolver = resolveSessionSkillView,
    private readonly now: () => Date = () => new Date(),
  ) {}

  invalidate(): number {
    this.revision += 1
    return this.revision
  }

  async assertSession(sessionId: string): Promise<void> {
    await this.resolver(this.ctx, sessionId)
  }

  async list(sessionId: string): Promise<CatalogResponse> {
    const { cwd, scope, registry } = await this.resolver(this.ctx, sessionId)
    const snapshot = await registry.snapshot({ cwd, scope })
    const wasBounded = snapshot.skills.length > MAX_SKILLS
    return {
      revision: this.revision,
      complete: snapshot.complete && !wasBounded,
      generatedAt: this.now().toISOString(),
      cwd: cwd.slice(0, MAX_PATH_CHARS),
      skills: snapshot.skills.slice(0, MAX_SKILLS).map(summaryDto),
    }
  }

  async detail(sessionId: string, name: string): Promise<SkillDetailResponse> {
    const { cwd, scope, registry } = await this.resolver(this.ctx, sessionId)
    const snapshot = await registry.snapshot({ cwd, scope })
    const summary = snapshot.skills.find(skill => skill.name === name)
    if (summary === undefined) {
      throw new CatalogError('skill/not-found', `skill "${name}" is unavailable`)
    }

    const definition = await registry.get(name, { cwd, scope })
    if (definition === undefined) {
      throw new CatalogError('skill/not-found', `skill "${name}" is unavailable`)
    }

    const contentTruncated = definition.content.length > MAX_CONTENT_CHARS
    return {
      ...summaryDto(summary),
      ...(definition.path === undefined ? {} : { path: definition.path.slice(0, MAX_PATH_CHARS) }),
      ...(definition.metadata === undefined
        ? {}
        : { metadata: sanitizeMetadata(definition.metadata) }),
      content: definition.content.slice(0, MAX_CONTENT_CHARS),
      contentTruncated,
    }
  }
}
