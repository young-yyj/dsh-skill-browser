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
    expect(SKILL_BROWSER_STYLES).toContain('-webkit-line-clamp:3')
    expect(SKILL_BROWSER_STYLES).toContain('grid-template-columns:minmax(0,1fr)')
    expect(SKILL_BROWSER_STYLES).toContain('background:#315fca;color:#fff')

    const disposeOwned = installSkillBrowserStyles()
    const disposeDuplicate = installSkillBrowserStyles()
    expect(document.querySelectorAll('style[data-plugin-css="qx-skill-browser"]')).toHaveLength(1)
    disposeDuplicate()
    expect(document.querySelectorAll('style[data-plugin-css="qx-skill-browser"]')).toHaveLength(1)
    disposeOwned()
    expect(document.querySelectorAll('style[data-plugin-css="qx-skill-browser"]')).toHaveLength(0)
  })
})
