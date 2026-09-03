import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { SkillBrowserApi } from './api.ts'
import { SkillBrowserEntry } from './SkillBrowser.tsx'
import { en, NS, zh } from './locales.ts'
import { installSkillBrowserStyles } from './styles.ts'

export const inject = ['slots', 'locale']

export function apply(ctx: Context): void {
  const api = new SkillBrowserApi()
  ctx.effect(installSkillBrowserStyles, 'skill-browser: styles')
  ctx.effect(
    () => ctx.locale.register(NS, { zh, en }),
    'skill-browser: dictionaries',
  )
  ctx.slots.inject(
    'conversation.session.header.utilities',
    () => ctx.slots.register({
      name: 'conversation.session.header.utilities',
      id: 'qx-skill-browser',
      order: 20,
      locale: NS,
      inject: () => ({ api }),
    }, SkillBrowserEntry),
  )
}
