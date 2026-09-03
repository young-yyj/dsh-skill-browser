export const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const MAX_SKILL_NAME_CHARS = 128
export const MAX_LABEL_CHARS = 256
export const MAX_DESCRIPTION_CHARS = 8_192
export const MAX_PATH_CHARS = 16_384
export const MAX_CONTENT_CHARS = 524_288
export const MAX_SKILLS = 10_000

export const SKILL_CATEGORIES = [
  'dsh',
  'development',
  'documents',
  'spreadsheets',
  'data',
  'research',
  'design',
  'visual',
  'media',
  'system',
  'collaboration',
  'governance',
  'lifestyle',
  'other',
] as const

export type SkillCategory = typeof SKILL_CATEGORIES[number]
export type CategoryFilter = 'all' | SkillCategory

export interface ResourceBaseDto {
  kind: 'directory' | 'url' | 'opaque'
  value: string
}

export interface BrowserSkillSummary {
  name: string
  description: string
  whenToUse?: string
  source: string
  provider: string
  modelInvocable: boolean
  userInvocable: boolean
  category: SkillCategory
  resourceBase?: ResourceBaseDto
}

export interface CatalogResponse {
  revision: number
  complete: boolean
  generatedAt: string
  cwd: string
  skills: BrowserSkillSummary[]
}

export interface SkillDetailResponse extends BrowserSkillSummary {
  path?: string
  metadata?: unknown
  content: string
  contentTruncated: boolean
}

export interface ErrorResponse {
  error: {
    code: string
    message: string
  }
}

export function isSkillName(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_SKILL_NAME_CHARS && SKILL_NAME.test(value)
}

export function isSkillCategory(value: unknown): value is SkillCategory {
  return typeof value === 'string' && (SKILL_CATEGORIES as readonly string[]).includes(value)
}

function isBoundedString(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length <= max
}

function isResourceBase(value: unknown): value is ResourceBaseDto {
  if (typeof value !== 'object' || value === null) return false
  const row = value as Partial<ResourceBaseDto>
  return (row.kind === 'directory' || row.kind === 'url' || row.kind === 'opaque')
    && isBoundedString(row.value, MAX_PATH_CHARS)
}

export function isBrowserSkillSummary(value: unknown): value is BrowserSkillSummary {
  if (typeof value !== 'object' || value === null) return false
  const row = value as Partial<BrowserSkillSummary>
  return isSkillName(row.name)
    && isBoundedString(row.description, MAX_DESCRIPTION_CHARS)
    && (row.whenToUse === undefined || isBoundedString(row.whenToUse, MAX_DESCRIPTION_CHARS))
    && isBoundedString(row.source, MAX_LABEL_CHARS)
    && isBoundedString(row.provider, MAX_LABEL_CHARS)
    && typeof row.modelInvocable === 'boolean'
    && typeof row.userInvocable === 'boolean'
    && isSkillCategory(row.category)
    && (row.resourceBase === undefined || isResourceBase(row.resourceBase))
}

export function isCatalogResponse(value: unknown): value is CatalogResponse {
  if (typeof value !== 'object' || value === null) return false
  const row = value as Partial<CatalogResponse>
  return Number.isInteger(row.revision)
    && (row.revision ?? -1) >= 0
    && typeof row.complete === 'boolean'
    && isBoundedString(row.generatedAt, 128)
    && isBoundedString(row.cwd, MAX_PATH_CHARS)
    && Array.isArray(row.skills)
    && row.skills.length <= MAX_SKILLS
    && row.skills.every(isBrowserSkillSummary)
}

export function isSkillDetailResponse(value: unknown): value is SkillDetailResponse {
  if (!isBrowserSkillSummary(value)) return false
  const row = value as Partial<SkillDetailResponse>
  return (row.path === undefined || isBoundedString(row.path, MAX_PATH_CHARS))
    && isBoundedString(row.content, MAX_CONTENT_CHARS)
    && typeof row.contentTruncated === 'boolean'
}

export function isErrorResponse(value: unknown): value is ErrorResponse {
  if (typeof value !== 'object' || value === null) return false
  const error = (value as Partial<ErrorResponse>).error
  return typeof error === 'object'
    && error !== null
    && isBoundedString(error.code, 128)
    && typeof error.message === 'string'
}

export function errorMessage(value: unknown): string {
  if (!isErrorResponse(value)) return 'skill browser request failed'
  return value.error.message.slice(0, 512)
}
