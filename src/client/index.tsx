import type { Context } from '@deepseek-ai/cordis'
import type { ComponentType } from 'react'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { SkillBrowserApi } from './api.ts'
import { PanelIcon } from './PanelIcon.tsx'
import { SkillBrowserPanel, type SkillBrowserTranslate } from './SkillBrowser.tsx'
import { en, NS, zh } from './locales.ts'
import { installSkillBrowserStyles } from './styles.ts'

export const inject = ['slots', 'locale']

/** 一级面板在 root 作用域的两个 slot：'main' 的 keyed 面板与 'sidebar.panellist' 的行条目。
 * 宿主 SlotMap 类型未把这两个 root slot 暴露给插件包，这里沿用运行时宽松契约（dsh-context 同款），
 * 硬约束只有一个：main 的 key 必须等于 panellist 条目的 id。 */
const PANEL_ID = 'qx-skill-browser'
/** 侧栏行位置：插件（0）、自动化任务（10）、上下文洞察（20）之后。 */
const PANEL_ORDER = 25

interface SlotRegistration {
  name: string
  id?: string
  order?: number
  key?: string
  locale?: string
  label?: () => string
  inject?: (sessionId?: string) => unknown
}

type LocaleFace = {
  register(ns: string, dicts: { zh: Record<string, string>; en: Record<string, string> }): () => void
  bind(ns: string): SkillBrowserTranslate
}

type SlotsFace = {
  inject(name: string, callback: () => unknown): unknown
  register(registration: SlotRegistration, component: ComponentType<Record<string, unknown>>): unknown
}

export function apply(ctx: Context): void {
  const slots = ctx.slots as unknown as SlotsFace
  const locale = ctx.locale as unknown as LocaleFace
  const api = new SkillBrowserApi()
  ctx.effect(installSkillBrowserStyles, 'skill-browser: styles')
  ctx.effect(
    () => locale.register(NS, { zh, en }),
    'skill-browser: dictionaries',
  )
  const t = locale.bind(NS)
  // 中央区域 keyed 面板：key 与侧栏行的 id 相同，layout.selectPanel 依赖这一点。
  slots.inject('main', () => slots.register(
    { name: 'main', key: PANEL_ID, locale: NS },
    props => SkillBrowserPanel({
      api,
      t: (typeof props.t === 'function' ? props.t : t) as SkillBrowserTranslate,
    }),
  ))
  // 左侧列的行条目：图标组件只接收 size；label 走绑定的双语 t。
  slots.inject('sidebar.panellist', () => slots.register(
    { name: 'sidebar.panellist', id: PANEL_ID, order: PANEL_ORDER, label: () => t('panel.label'), locale: NS },
    props => PanelIcon({ size: typeof props.size === 'number' ? props.size : undefined }),
  ))
}
