/** @vitest-environment jsdom */

import React from 'react'
import { act } from 'react-dom/test-utils'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CatalogResponse, SkillDetailResponse } from '../src/contracts.ts'
import {
  SkillBrowserEntry,
  type SkillBrowserClient,
} from '../src/client/SkillBrowser.tsx'
import { zh, type SkillBrowserLocaleKey } from '../src/client/locales.ts'

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const catalog: CatalogResponse = {
  revision: 1,
  complete: true,
  generatedAt: '2026-09-03T01:02:03.000Z',
  cwd: 'C:/fixtures/skills',
  skills: [
    {
      name: 'pdf',
      description: '读取与创建 PDF 文档',
      source: 'user',
      provider: 'filesystem',
      modelInvocable: true,
      userInvocable: true,
      category: 'documents',
    },
    {
      name: 'agent-browser',
      description: '浏览器自动化',
      whenToUse: '需要操作网页时',
      source: 'user',
      provider: 'filesystem',
      modelInvocable: true,
      userInvocable: false,
      category: 'system',
    },
    {
      name: 'frontend-design',
      description: '构建高质量前端界面',
      source: 'bundled',
      provider: 'filesystem',
      modelInvocable: true,
      userInvocable: true,
      category: 'design',
    },
  ],
}

const detail: SkillDetailResponse = {
  ...catalog.skills[0]!,
  path: 'C:/fixtures/skills/pdf/SKILL.md',
  metadata: { owner: '<script>alert(1)</script>' },
  content: '# PDF\n\n<script>window.__unsafe = true</script>',
  contentTruncated: false,
}

function translator(key: SkillBrowserLocaleKey, params?: Record<string, unknown>): string {
  let value: string = zh[key]
  for (const [name, replacement] of Object.entries(params ?? {})) {
    value = value.replaceAll(`{${name}}`, String(replacement))
  }
  return value
}

class FakeClient implements SkillBrowserClient {
  readonly catalog = vi.fn(async () => catalog)
  readonly detail = vi.fn(async () => detail)
  readonly disposeSubscription = vi.fn()
  onCatalog: (() => void) | undefined

  subscribe(_sessionId: string, onCatalog: () => void): () => void {
    this.onCatalog = onCatalog
    return this.disposeSubscription
  }
}

function buttonNamed(name: string): HTMLButtonElement {
  const button = [...document.querySelectorAll('button')]
    .find(element => element.textContent?.includes(name))
  if (!(button instanceof HTMLButtonElement)) throw new Error(`button not found: ${name}`)
  return button
}

async function click(element: HTMLElement): Promise<void> {
  await act(async () => {
    element.click()
    await Promise.resolve()
  })
}

function enterSearch(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('SkillBrowserEntry', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    document.body.replaceChildren()
    document.body.style.overflow = ''
    delete (window as typeof window & { __unsafe?: boolean }).__unsafe
  })

  it('shows missing and invalid metadata feedback while keeping detail accessible', async () => {
    const api = new FakeClient()
    api.catalog.mockResolvedValue({ ...catalog, skills: [
      { ...catalog.skills[0]!, description: '' },
      { ...catalog.skills[1]!, description: '', metadataError: 'Invalid YAML' },
    ] })
    api.detail.mockResolvedValue({ ...detail, name: 'agent-browser', description: '', metadataError: 'Invalid YAML' })
    await act(async () => root.render(
      <SkillBrowserEntry sessionId={'session-feedback' as never} api={api} t={translator} />,
    ))
    await click(buttonNamed('技能'))
    expect(document.querySelector('[data-skill-card="pdf"]')?.textContent).toContain('暂无简介')
    expect(document.querySelector('[data-skill-card="agent-browser"]')?.textContent).toContain('技能元数据解析失败')
    await click(buttonNamed('agent-browser'))
    expect(document.querySelector('[data-skill-detail]')?.textContent).toContain('Invalid YAML')
    expect(document.querySelector('[data-skill-detail]')?.textContent).toContain('# PDF')
  })

  it('filters by output format and offers a counted relaxation for incompatible input', async () => {
    const api = new FakeClient()
    await act(async () => root.render(
      <SkillBrowserEntry sessionId="formats" api={api} t={translator} />,
    ))
    await click(buttonNamed('技能'))
    const html = document.querySelector<HTMLButtonElement>('[data-output="HTML"]')
    expect(html).not.toBeNull()
    await click(html!)
    expect(document.querySelectorAll('[data-skill-card]')).toHaveLength(1)
    expect(document.querySelector('[data-skill-card="frontend-design"]')).not.toBeNull()
    await click(document.querySelector<HTMLButtonElement>('[data-input="CSV"]')!)
    expect(document.querySelectorAll('[data-skill-card]')).toHaveLength(0)
    await click(buttonNamed('移除输入限制'))
    expect(document.querySelectorAll('[data-skill-card]')).toHaveLength(1)
    expect(document.querySelector('.qx-sb-card-body')?.textContent).toContain('适用于')
    await click(buttonNamed('清空筛选'))
    expect(document.querySelectorAll('[data-skill-card]')).toHaveLength(3)
  })

  it('opens, filters, shows inert detail text, and restores focus on close', async () => {
    const api = new FakeClient()
    await act(async () => root.render(
      <SkillBrowserEntry sessionId={'session-1' as never} api={api} t={translator} />,
    ))

    const trigger = buttonNamed('技能')
    trigger.focus()
    await click(trigger)

    expect(api.catalog).toHaveBeenCalledWith('session-1', expect.any(AbortSignal))
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
    expect(document.querySelector('[role="dialog"] > header')).toBeNull()
    expect(document.querySelector('.qx-sb-pills')?.getAttribute('role')).toBe('group')
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.textContent).toContain('共 3 个技能')

    const search = document.querySelector<HTMLInputElement>('[type="search"]')
    expect(search).not.toBeNull()
    await act(async () => {
      if (!search) return
      enterSearch(search, '读取与创建 PDF 文档')
    })
    expect(document.querySelectorAll('[data-skill-card]')).toHaveLength(1)
    expect(document.body.textContent).toContain('pdf')
    expect(document.body.textContent).not.toContain('agent-browser')

    await act(async () => {
      if (!search) return
      enterSearch(search, '')
    })
    await click(buttonNamed('办公文件'))
    expect(document.querySelectorAll('[data-skill-card]')).toHaveLength(1)

    await click(buttonNamed('pdf'))
    expect(api.detail).toHaveBeenCalledWith('session-1', 'pdf', expect.any(AbortSignal))
    expect(document.querySelector('[data-skill-detail]')?.textContent).toContain('# PDF')
    expect(document.querySelector<HTMLElement>('.qx-sb-drawer-body')?.tabIndex).toBe(0)
    expect(document.querySelector('[data-skill-detail] script')).toBeNull()
    expect((window as typeof window & { __unsafe?: boolean }).__unsafe).toBeUndefined()

    await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })))
    expect(document.querySelector('[data-skill-detail]')).toBeNull()
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()

    await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })))
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(trigger)
    expect(api.disposeSubscription).toHaveBeenCalledOnce()
  })

  it('reloads only while open and exposes empty search feedback', async () => {
    const api = new FakeClient()
    await act(async () => root.render(
      <SkillBrowserEntry sessionId={'session-2' as never} api={api} t={translator} />,
    ))
    expect(api.catalog).not.toHaveBeenCalled()

    await click(buttonNamed('技能'))
    expect(api.catalog).toHaveBeenCalledTimes(1)
    await act(async () => {
      api.onCatalog?.()
      await Promise.resolve()
    })
    expect(api.catalog).toHaveBeenCalledTimes(2)

    const search = document.querySelector<HTMLInputElement>('[type="search"]')
    await act(async () => {
      if (!search) return
      enterSearch(search, 'definitely-missing')
    })
    expect(document.body.textContent).toContain('没有匹配的技能')
  })

  it('shows refresh failures beside stale data and reloads an open detail after catalog refresh', async () => {
    const api = new FakeClient()
    await act(async () => root.render(
      <SkillBrowserEntry sessionId={'session-3' as never} api={api} t={translator} />,
    ))
    await click(buttonNamed('技能'))
    await click(buttonNamed('pdf'))
    expect(document.querySelector('[data-skill-detail]')?.textContent).toContain('# PDF')

    api.catalog.mockRejectedValueOnce(new Error('refresh unavailable'))
    await act(async () => {
      api.onCatalog?.()
      await Promise.resolve()
    })
    expect(document.body.textContent).toContain('refresh unavailable')
    expect(document.querySelectorAll('[data-skill-card]')).toHaveLength(3)

    api.detail.mockResolvedValue({ ...detail, content: '# PDF updated' })
    await act(async () => {
      api.onCatalog?.()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(api.detail).toHaveBeenCalledTimes(2)
    expect(document.querySelector('[data-skill-detail]')?.textContent).toContain('# PDF updated')
  })

  it('shows each skill source on its card', async () => {
    const api = new FakeClient()
    await act(async () => root.render(
      <SkillBrowserEntry sessionId={'session-4' as never} api={api} t={translator} />,
    ))
    await click(buttonNamed('技能'))
    expect(document.querySelector('[data-skill-card="pdf"]')?.textContent).toContain('user')
    expect(document.querySelector('[data-skill-card="frontend-design"]')?.textContent).toContain('内置')
  })
})
