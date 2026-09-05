import type { Dirent } from 'node:fs'
import { lstat, open, readdir, realpath } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
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

function frontmatter(content: string): Record<string, string> {
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) return {}
  const end = content.indexOf('\n---', 4)
  if (end === -1) return {}
  const result: Record<string, string> = {}
  for (const line of content.slice(4, end).split(/\r?\n/u)) {
    const match = /^([a-zA-Z][\w-]*):\s*(.*)$/u.exec(line)
    if (match?.[1] !== undefined && match[2] !== undefined) {
      result[match[1]] = match[2].replace(/^(?:"|')|(?:"|')$/gu, '').trim()
    }
  }
  return result
}

function descriptionFor(content: string): { description: string, whenToUse?: string } {
  const metadata = frontmatter(content)
  const description = (metadata.description ?? '').slice(0, MAX_DESCRIPTION_CHARS)
  const whenToUse = metadata['when-to-use']?.slice(0, MAX_DESCRIPTION_CHARS)
  return whenToUse === undefined ? { description } : { description, whenToUse }
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
