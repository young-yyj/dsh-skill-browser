/** @vitest-environment jsdom */

import { describe, expect, it } from 'vitest'
import { en, zh } from '../src/client/locales.ts'
import { installSkillBrowserStyles, SKILL_BROWSER_STYLES } from '../src/client/styles.ts'

describe('skill browser presentation contract', () => {
  it('keeps Chinese and English dictionaries in exact key parity', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())
  })

  it('ships responsive, reduced-motion, focus, and DSH-theme rules once', () => {
    expect(SKILL_BROWSER_STYLES).toContain('@media (max-width:1100px)')
    expect(SKILL_BROWSER_STYLES).toContain('@media (max-width:719px)')
    expect(SKILL_BROWSER_STYLES).toContain('prefers-reduced-motion:reduce')
    expect(SKILL_BROWSER_STYLES).toContain(':focus-visible')
    expect(SKILL_BROWSER_STYLES).toContain('--dsw-alias-')
    expect(SKILL_BROWSER_STYLES).toContain('-webkit-line-clamp:2')
    expect(SKILL_BROWSER_STYLES).toContain('grid-auto-rows:1fr')
    expect(SKILL_BROWSER_STYLES).toContain('.qx-sb-format-more')
    expect(SKILL_BROWSER_STYLES).toContain('grid-template-columns:minmax(0,1fr)')
    expect(SKILL_BROWSER_STYLES).toContain('border-color:var(--dsw-alias-interactive-primary')
    expect(SKILL_BROWSER_STYLES).toContain('--qxsb-c1:')
    expect(SKILL_BROWSER_STYLES).toContain('@container')
    // 一级面板形态:满高页面根;详情为居中弹窗,无抽屉/旧模态残留
    expect(SKILL_BROWSER_STYLES).toContain('.qx-sb-page{')
    expect(SKILL_BROWSER_STYLES).toContain('container:qxsb/inline-size;--qxsb-c1:')
    expect(SKILL_BROWSER_STYLES).toContain('.qx-sb-modal{')
    expect(SKILL_BROWSER_STYLES).toContain('.qx-sb-detail-flow{')
    expect(SKILL_BROWSER_STYLES).not.toContain('qx-sb-backdrop')
    expect(SKILL_BROWSER_STYLES).not.toContain('qx-sb-dialog')
    expect(SKILL_BROWSER_STYLES).not.toContain('.qx-sb-trigger{')
    expect(SKILL_BROWSER_STYLES).not.toContain('qx-sb-drawer')
    expect(SKILL_BROWSER_STYLES).not.toContain('qx-sb-raw')

    const disposeOwned = installSkillBrowserStyles()
    const disposeDuplicate = installSkillBrowserStyles()
    expect(document.querySelectorAll('style[data-plugin-css="qx-skill-browser"]')).toHaveLength(1)
    disposeDuplicate()
    expect(document.querySelectorAll('style[data-plugin-css="qx-skill-browser"]')).toHaveLength(1)
    disposeOwned()
    expect(document.querySelectorAll('style[data-plugin-css="qx-skill-browser"]')).toHaveLength(0)
  })
})
