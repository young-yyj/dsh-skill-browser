const MAX_DEPTH = 8
const MAX_KEYS = 256
const MAX_ARRAY_ITEMS = 256
const MAX_STRING_CHARS = 16_384
const MAX_SERIALIZED_CHARS = 65_536
const OMIT = Symbol('omit')
const UNSAFE_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

type Sanitized = null | boolean | number | string | Sanitized[] | { [key: string]: Sanitized }

function visit(value: unknown, depth: number, stack: WeakSet<object>): Sanitized | typeof OMIT {
  if (value === null || typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : OMIT
  if (typeof value === 'string') return value.slice(0, MAX_STRING_CHARS)
  if (typeof value !== 'object') return OMIT
  if (depth >= MAX_DEPTH) return '[metadata omitted: depth exceeded]'
  if (stack.has(value)) return '[metadata omitted: cycle]'

  stack.add(value)
  try {
    if (Array.isArray(value)) {
      return value.slice(0, MAX_ARRAY_ITEMS).map(item => {
        const clean = visit(item, depth + 1, stack)
        return clean === OMIT ? null : clean
      })
    }

    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) return OMIT

    const output: Record<string, Sanitized> = Object.create(null)
    const descriptors = Object.getOwnPropertyDescriptors(value)
    let accepted = 0
    for (const key of Object.keys(descriptors)) {
      if (accepted >= MAX_KEYS) break
      if (UNSAFE_KEYS.has(key)) continue
      const descriptor = descriptors[key]
      if (descriptor === undefined || !('value' in descriptor)) continue
      const clean = visit(descriptor.value, depth + 1, stack)
      if (clean === OMIT) continue
      output[key] = clean
      accepted += 1
    }
    return output
  } finally {
    stack.delete(value)
  }
}

export function sanitizeMetadata(value: unknown): unknown {
  const cleaned = visit(value, 0, new WeakSet())
  const result = cleaned === OMIT ? null : cleaned
  const serialized = JSON.stringify(result)
  if (serialized !== undefined && serialized.length > MAX_SERIALIZED_CHARS) {
    return '[metadata omitted: limit exceeded]'
  }
  return result
}
