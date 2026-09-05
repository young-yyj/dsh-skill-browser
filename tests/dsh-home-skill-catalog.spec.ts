import { mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { DshHomeSkillCatalog } from '../src/host/dsh-home-skill-catalog.ts'
import { MAX_CONTENT_CHARS } from '../src/contracts.ts'

const roots: string[] = []

async function skillsRoot(): Promise<string> {
  const root = join(tmpdir(), `dsh-skill-browser-${crypto.randomUUID()}`, 'skills')
  await mkdir(root, { recursive: true })
  roots.push(root)
  return root
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(join(root, '..'), { recursive: true, force: true })))
})

describe('DshHomeSkillCatalog', () => {
  it('scans only direct DSH Home skill folders and parses frontmatter', async () => {
    const root = await skillsRoot()
    await mkdir(join(root, 'xlsx'))
    await writeFile(join(root, 'xlsx', 'SKILL.md'), '---\ndescription: Excel workbooks\nwhen-to-use: Build a spreadsheet\n---\n# xlsx\n')
    await mkdir(join(root, 'nested', 'pdf'), { recursive: true })
    await writeFile(join(root, 'nested', 'pdf', 'SKILL.md'), '# ignored\n')
    const catalog = new DshHomeSkillCatalog({
      skillsRoot: () => root,
      displayRoot: () => '$DSH_HOME/skills',
      now: () => new Date('2026-09-05T00:00:00.000Z'),
    })

    await expect(catalog.list(3)).resolves.toEqual({
      revision: 3,
      complete: true,
      generatedAt: '2026-09-05T00:00:00.000Z',
      cwd: '$DSH_HOME/skills',
      skills: [{
        name: 'xlsx', description: 'Excel workbooks', whenToUse: 'Build a spreadsheet',
        source: 'dsh-home', provider: 'filesystem', modelInvocable: true, userInvocable: true,
        category: 'spreadsheets', resourceBase: { kind: 'opaque', value: '$DSH_HOME/skills/xlsx' },
      }],
    })
  })

  it.skipIf(process.platform === 'win32')('does not follow a skill file symlink outside DSH Home', async () => {
    const root = await skillsRoot()
    const outside = join(root, '..', 'outside.md')
    await writeFile(outside, '# private\n')
    await mkdir(join(root, 'outside'))
    await symlink(outside, join(root, 'outside', 'SKILL.md'))
    const catalog = new DshHomeSkillCatalog({ skillsRoot: () => root, displayRoot: () => '$DSH_HOME/skills' })

    await expect(catalog.list(0)).resolves.toMatchObject({ skills: [] })
    await expect(catalog.detail('outside')).rejects.toMatchObject({ code: 'skill/not-found' })
  })

  it('limits an oversized SKILL.md without exposing an unbounded response', async () => {
    const root = await skillsRoot()
    await mkdir(join(root, 'large'))
    await writeFile(join(root, 'large', 'SKILL.md'), 'x'.repeat(MAX_CONTENT_CHARS + 20))
    const catalog = new DshHomeSkillCatalog({ skillsRoot: () => root, displayRoot: () => '$DSH_HOME/skills' })

    const detail = await catalog.detail('large')
    expect(detail.content).toHaveLength(MAX_CONTENT_CHARS)
    expect(detail.contentTruncated).toBe(true)
  })
})
