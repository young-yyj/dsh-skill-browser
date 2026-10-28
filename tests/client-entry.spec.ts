/** @vitest-environment jsdom */

import { describe, expect, it, vi } from 'vitest'
import { apply } from '../src/client/index.tsx'
import { NS } from '../src/client/locales.ts'

describe('client plugin entry', () => {
  it('registers dictionaries, the main panel, and one sidebar panel entry', () => {
    const dispose = vi.fn()
    const registerLocale = vi.fn(() => dispose)
    const injects: Array<{ name: string, callback: () => unknown }> = []
    const injectSlot = vi.fn((name: string, callback: () => unknown) => {
      injects.push({ name, callback })
      callback()
      return dispose
    })
    const registrations: Array<{ options: Record<string, unknown> }> = []
    const registerSlot = vi.fn((options: Record<string, unknown>, _component: unknown) => {
      registrations.push({ options })
      return dispose
    })
    const cleanup: Array<() => void> = []
    const effect = vi.fn((callback: () => unknown) => {
      const result = callback()
      if (typeof result === 'function') cleanup.push(result as () => void)
      return result
    })
    const originalEventSource = globalThis.EventSource
    globalThis.EventSource = class {} as unknown as typeof EventSource

    try {
      apply({
        locale: {
          register: registerLocale,
          bind: () => (key: string) => key,
        },
        slots: { register: registerSlot, inject: injectSlot },
        effect,
      } as never)
    } finally {
      globalThis.EventSource = originalEventSource
    }

    expect(registerLocale).toHaveBeenCalledWith(NS, expect.objectContaining({ zh: expect.any(Object), en: expect.any(Object) }))

    const injectNames = injects.map(injection => injection.name)
    expect(injectNames).toContain('main')
    expect(injectNames).toContain('sidebar.panellist')

    const mainRegistration = registrations.find(row => row.options.name === 'main')
    const panelEntry = registrations.find(row => row.options.name === 'sidebar.panellist')
    expect(mainRegistration).toBeDefined()
    expect(panelEntry).toBeDefined()
    // 硬约束:keyed main 面板的 key 必须等于侧栏行的 id,layout.selectPanel 依赖这一点
    expect(mainRegistration?.options.key).toBe('qx-skill-browser')
    expect(panelEntry?.options.id).toBe('qx-skill-browser')
    // 排序:上下文洞察(20)之后
    expect(panelEntry?.options.order).toBeGreaterThan(20)
    expect(typeof panelEntry?.options.label).toBe('function')

    cleanup.reverse().forEach(disposeEffect => disposeEffect())
    expect(document.querySelectorAll('style[data-plugin-css="qx-skill-browser"]')).toHaveLength(0)
  })
})
