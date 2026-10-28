import { readFileSync } from 'node:fs'
import { satisfies } from 'semver'
import { describe, expect, it } from 'vitest'

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const compatibilityRange: string = manifest.engines.dsh

describe('DSH client service dependencies', () => {
  it('loads the renderer that provides ctx.slots before the client entry', () => {
    expect(manifest.dsh.client.inject).toContain('@deepseek-ai/dsh-client-ui-renderer')
    expect(manifest.dsh.client.inject).not.toContain('@deepseek-ai/dsh-client-runtime')
    for (const name of manifest.dsh.client.inject) {
      expect(manifest.peerDependencies[name]).toBe(manifest.devDependencies[name])
    }
  })

  it('declares one compatibility range that includes every pinned DSH package', () => {
    expect(manifest.engines.dsh).toBe(manifest.dsh.engines.dsh)
    expect(compatibilityRange).toBeTypeOf('string')
    for (const name of manifest.dsh.client.inject) {
      expect(satisfies(manifest.devDependencies[name], compatibilityRange, { includePrerelease: true })).toBe(true)
    }
    expect(satisfies(manifest.dependencies['@deepseek-ai/dsh-home-paths'], compatibilityRange, { includePrerelease: true })).toBe(true)
  })
})
