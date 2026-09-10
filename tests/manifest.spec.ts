import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

describe('DSH client service dependencies', () => {
  it('loads the renderer that provides ctx.slots before the client entry', () => {
    expect(manifest.dsh.client.inject).toContain('@deepseek-ai/dsh-client-ui-renderer')
    expect(manifest.dsh.client.inject).not.toContain('@deepseek-ai/dsh-client-runtime')
    for (const name of manifest.dsh.client.inject) {
      expect(manifest.peerDependencies[name]).toBe(manifest.dsh.engines.dsh)
      expect(manifest.devDependencies[name]).toBe(manifest.dsh.engines.dsh)
    }
  })
})
