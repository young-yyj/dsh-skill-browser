/** @vitest-environment jsdom */

import { describe, expect, it, vi } from 'vitest'
import { apply } from '../src/client/index.tsx'
import { NS } from '../src/client/locales.ts'

describe('client plugin entry', () => {
  it('registers dictionaries and one session-header utility contribution', () => {
    const dispose = vi.fn()
    const registerLocale = vi.fn(() => dispose)
    const registerSlot = vi.fn((_options: Record<string, unknown>, _component: unknown) => dispose)
    const injectSlot = vi.fn((_name: string, callback: () => unknown) => callback())
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
        locale: { register: registerLocale },
        slots: { register: registerSlot, inject: injectSlot },
        effect,
      } as never)
    } finally {
      globalThis.EventSource = originalEventSource
    }

    expect(registerLocale).toHaveBeenCalledWith(NS, expect.objectContaining({ zh: expect.any(Object), en: expect.any(Object) }))
    expect(injectSlot).toHaveBeenCalledWith('conversation.session.header.utilities', expect.any(Function))
    expect(registerSlot).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'conversation.session.header.utilities',
        id: 'qx-skill-browser',
        locale: NS,
        inject: expect.any(Function),
      }),
      expect.any(Function),
    )
    const registration = registerSlot.mock.calls[0]?.[0]
    expect((registration?.inject as () => unknown)()).toEqual({ api: expect.any(Object) })
    expect(document.querySelectorAll('style[data-plugin-css="qx-skill-browser"]')).toHaveLength(1)
    cleanup.reverse().forEach(disposeEffect => disposeEffect())
    expect(document.querySelectorAll('style[data-plugin-css="qx-skill-browser"]')).toHaveLength(0)
  })
})
