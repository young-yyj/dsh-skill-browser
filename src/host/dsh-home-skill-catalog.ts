import type { Dirent } from 'node:fs'
import { lstat, open, readdir, realpath } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { parseDocument } from 'yaml'
import { dshHomeDisplay, dshHomePath } from '@deepseek-ai/dsh-home-paths'
import { classifySkill } from '../classifier.ts'
import {
  MAX_CONTENT_CHARS,
  MAX_DESCRIPTION_CHARS,
  MAX_SKILLS,
  isSkillName,
  type BrowserSkillSummary,
  type CatalogResponse,
  type SkillDetailResponse,
} from '../contracts.ts'
import { CatalogError } from './catalog-service.ts'

interface IndexedSkill {
  summary: BrowserSkillSummary
  skillFile: string
}

export interface DshHomeSkillCatalogOptions {
  skillsRoot?: () => string
  displayRoot?: () => string
  now?: () => Date
}

function isContained(root: string, target: string): boolean {
  const difference = relative(root, target)
  return difference === '' || (!difference.startsWith(`..${sep}`) && difference !== '..')
}

function frontmatter(content: string): Record<string, unknown> {
  const normalized = content.replace(/^\uFEFF/u, '').replace(/\r\n?/gu, '\n')
  if (!/^---[ \t]*\n/u.test(normalized)) return {}
  const lines = normalized.split('\n')
  const end = lines.findIndex((line, index) => index > 0 && /^(?:---|\.\.\.)[ \t]*$/u.test(line))
  if (end === -1) throw new Error('Missing frontmatter closing delimiter')
  const document = parseDocument(lines.slice(1, end).join('\n'), { prettyErrors: false })
  if (document.errors.length) throw document.errors[0]
  if (document.warnings.length) throw document.warnings[0]
  const metadata: unknown = document.toJS({ maxAliasCount: 0 })
  if (metadata === null) return {}
  if (typeof metadata !== 'object' || Array.isArray(metadata)) throw new Error('Frontmatter must be a mapping')
  return metadata as Record<string, unknown>
}

function descriptionFor(content: string): Pick<BrowserSkillSummary, 'description' | 'whenToUse' | 'metadataError'> {
  try {
    const metadata = frontmatter(content)
    const field = (key: string): string | undefined => {
      const value = metadata[key]
      if (value === undefined || value === null) return undefined
      if (typeof value !== 'string') throw new Error(`${key} must be a string`)
      return value.trim().slice(0, MAX_DESCRIPTION_CHARS)
    }
    const description = field('description') ?? ''
    const whenToUse = field('when-to-use')
    return whenToUse === undefined ? { description } : { description, whenToUse }
  } catch (error) {
    return { description: '', metadataError: (error instanceof Error ? error.message : 'Invalid YAML metadata').slice(0, 256) }
  }
}

async function readSkillFile(path: string): Promise<{ content: string, truncated: boolean }> {
  const handle = await open(path, 'r')
  try {
    const buffer = Buffer.allocUnsafe(MAX_CONTENT_CHARS + 1)
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0)
    return {
      content: buffer.subarray(0, Math.min(bytesRead, MAX_CONTENT_CHARS)).toString('utf8'),
      truncated: bytesRead > MAX_CONTENT_CHARS,
    }
  } finally {
    await handle.close()
  }
}

export class DshHomeSkillCatalog {
  private readonly skillsRoot: () => string
  private readonly displayRoot: () => string
  private readonly now: () => Date

  constructor(options: DshHomeSkillCatalogOptions = {}) {
    this.skillsRoot = options.skillsRoot ?? (() => dshHomePath('skills'))
    this.displayRoot = options.displayRoot ?? (() => `${dshHomeDisplay(dshHomePath())}/skills`)
    this.now = options.now ?? (() => new Date())
  }

  private async index(): Promise<Map<string, IndexedSkill>> {
    const root = this.skillsRoot()
    let resolvedRoot: string
    try {
      resolvedRoot = await realpath(root)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return new Map()
      throw new CatalogError('skills/unavailable', 'DSH Home skills directory could not be read')
    }

    let entries: Dirent<string>[]
    try {
      entries = await readdir(resolvedRoot, { withFileTypes: true, encoding: 'utf8' })
    } catch {
      throw new CatalogError('skills/unavailable', 'DSH Home skills directory could not be read')
    }
    const indexed = new Map<string, IndexedSkill>()
    for (const entry of entries) {
      if (!entry.isDirectory() || !isSkillName(entry.name) || indexed.size >= MAX_SKILLS) continue
      const candidate = join(resolvedRoot, entry.name, 'SKILL.md')
      try {
        const fileStatus = await lstat(candidate)
        if (!fileStatus.isFile() || fileStatus.isSymbolicLink()) continue
        const resolvedFile = await realpath(candidate)
        if (!isContained(resolvedRoot, resolvedFile)) continue
        const { content } = await readSkillFile(resolvedFile)
        const details = descriptionFor(content)
        const summary: BrowserSkillSummary = {
          name: entry.name,
          ...details,
          source: 'dsh-home',
          provider: 'filesystem',
          modelInvocable: true,
          userInvocable: true,
          category: classifySkill({ name: entry.name, ...details }),
          resourceBase: { kind: 'opaque', value: `${this.displayRoot()}/${entry.name}` },
        }
        indexed.set(entry.name, { summary, skillFile: resolvedFile })
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') continue
      }
    }
    return indexed
  }

  async list(revision: number): Promise<CatalogResponse> {
    const skills = [...(await this.index()).values()]
      .map(skill => skill.summary)
      .sort((left, right) => left.name.localeCompare(right.name))
    return {
      revision,
      complete: skills.length < MAX_SKILLS,
      generatedAt: this.now().toISOString(),
      cwd: this.displayRoot(),
      skills,
    }
  }

  async detail(name: string): Promise<SkillDetailResponse> {
    const skill = (await this.index()).get(name)
    if (skill === undefined) throw new CatalogError('skill/not-found', `skill "${name}" is unavailable`)
    let content: string
    let contentTruncated: boolean
    try {
      ({ content, truncated: contentTruncated } = await readSkillFile(skill.skillFile))
    } catch {
      throw new CatalogError('skill/not-found', `skill "${name}" is unavailable`)
    }
    return {
      ...skill.summary,
      path: `${this.displayRoot()}/${name}/SKILL.md`,
      content,
      contentTruncated,
    }
  }
}
