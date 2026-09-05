import { watch, type FSWatcher } from 'node:fs'
import { dshHomePath } from '@deepseek-ai/dsh-home-paths'
import type { CatalogResponse, SkillDetailResponse } from '../contracts.ts'
import { DshHomeSkillCatalog } from './dsh-home-skill-catalog.ts'

export class CatalogError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'CatalogError'
  }
}

export class CatalogService {
  private revision = 0
  private readonly catalog: DshHomeSkillCatalog

  constructor(catalog = new DshHomeSkillCatalog()) {
    this.catalog = catalog
  }

  invalidate(): number {
    this.revision += 1
    return this.revision
  }

  list(): Promise<CatalogResponse> {
    return this.catalog.list(this.revision)
  }

  detail(name: string): Promise<SkillDetailResponse> {
    return this.catalog.detail(name)
  }

  watch(onChange: () => void): () => void {
    let watcher: FSWatcher | undefined
    try {
      watcher = watch(dshHomePath('skills'), { recursive: true }, (_event, filename) => {
        if (filename === null || String(filename).endsWith('SKILL.md')) onChange()
      })
    } catch {
      // The catalog remains available when the directory is not created yet.
    }
    return () => watcher?.close()
  }
}
