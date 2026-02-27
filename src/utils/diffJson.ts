import type { JsonValue } from '../types'

export type DiffLine =
  | { type: 'unchanged'; left: string; right: string }
  | { type: 'changed'; left: string; right: string }
  | { type: 'add'; right: string }
  | { type: 'remove'; left: string }

export type DiffResult =
  | { kind: 'ok'; lines: DiffLine[] }
  | { kind: 'parseError'; message: string; side: 'left' | 'right' }

/**
 * Parse JSON and return normalized formatted string, or null and error message.
 */
export function tryParseAndNormalize(
  input: string
): { normalized: string } | { error: string } {
  const trimmed = input.trim()
  if (trimmed === '') return { error: 'Enter JSON' }
  try {
    const parsed = JSON.parse(trimmed) as JsonValue
    return { normalized: JSON.stringify(parsed, null, 2) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Invalid JSON' }
  }
}

function isPrimitive(v: JsonValue): boolean {
  return v === null || typeof v !== 'object'
}

function pad(indent: number): string {
  return '  '.repeat(indent)
}

/** Format a single key-value line (primitive) or key + opening brace/bracket. */
function formatKeyValueLine(indent: number, key: string, value: JsonValue): string {
  const sp = pad(indent + 1)
  if (isPrimitive(value)) {
    return `${sp}"${key}": ${JSON.stringify(value)}`
  }
  if (Array.isArray(value)) {
    return `${sp}"${key}": [`
  }
  return `${sp}"${key}": {`
}

/** All lines for a key-value (for remove/add when only one side has it). */
function formatKeyValueLines(key: string, value: JsonValue, indent: number): string[] {
  const sp = pad(indent + 1)
  const spOut = pad(indent)
  if (isPrimitive(value)) {
    return [`${sp}"${key}": ${JSON.stringify(value)}`]
  }
  if (Array.isArray(value)) {
    const inner = value.flatMap((item) => formatValueLines(item, indent + 1))
    return [`${sp}"${key}": [`, ...inner, `${spOut}]`]
  }
  const inner = objectLines(value as { [key: string]: JsonValue }, indent + 1)
  return [`${sp}"${key}": {`, ...inner, `${spOut}}`]
}

function objectLines(obj: { [key: string]: JsonValue }, indent: number): string[] {
  const keys = Object.keys(obj).sort()
  const lines: string[] = []
  for (const key of keys) {
    lines.push(...formatKeyValueLines(key, obj[key], indent))
  }
  return lines
}

function formatValueLines(value: JsonValue, indent: number): string[] {
  const sp = pad(indent + 1)
  const spOut = pad(indent)
  if (isPrimitive(value)) {
    return [`${sp}${JSON.stringify(value)}`]
  }
  if (Array.isArray(value)) {
    const inner = value.flatMap((item) => formatValueLines(item, indent + 2))
    return [`${sp}[`, ...inner, `${spOut}]`]
  }
  return [`${sp}{`, ...objectLines(value as { [key: string]: JsonValue }, indent + 1), `${spOut}}`]
}

function structuralDiffValue(a: JsonValue, b: JsonValue, indent: number): DiffLine[] {
  const aPrim = isPrimitive(a)
  const bPrim = isPrimitive(b)

  if (aPrim && bPrim) {
    const aStr = JSON.stringify(a)
    const bStr = JSON.stringify(b)
    if (aStr === bStr) {
      return [] // no line at this level; parent will emit
    }
    return [{ type: 'changed', left: aStr, right: bStr }]
  }

  if (!aPrim && !bPrim && Array.isArray(a) && Array.isArray(b)) {
    return structuralDiffArray(a, b, indent)
  }
  if (!aPrim && !bPrim && !Array.isArray(a) && !Array.isArray(b)) {
    return structuralDiffObject(a as { [key: string]: JsonValue }, b as { [key: string]: JsonValue }, indent)
  }

  // Different types: emit as remove + add (multi-line for object/array)
  const leftLines = aPrim ? [JSON.stringify(a)] : formatValueLines(a, indent)
  const rightLines = bPrim ? [JSON.stringify(b)] : formatValueLines(b, indent)
  const result: DiffLine[] = []
  for (const line of leftLines) result.push({ type: 'remove', left: line })
  for (const line of rightLines) result.push({ type: 'add', right: line })
  return result
}

function structuralDiffObject(
  a: { [key: string]: JsonValue },
  b: { [key: string]: JsonValue },
  indent: number
): DiffLine[] {
  const keysA = Object.keys(a).sort()
  const keysB = Object.keys(b).sort()
  const allKeys = [...new Set([...keysA, ...keysB])].sort()
  const lines: DiffLine[] = []

  for (const key of allKeys) {
    const inA = key in a
    const inB = key in b
    if (inA && inB) {
      const aVal = a[key]
      const bVal = b[key]
      const aPrim = isPrimitive(aVal)
      const bPrim = isPrimitive(bVal)

      if (aPrim && bPrim) {
        const leftLine = formatKeyValueLine(indent, key, aVal)
        const rightLine = formatKeyValueLine(indent, key, bVal)
        if (JSON.stringify(aVal) === JSON.stringify(bVal)) {
          lines.push({ type: 'unchanged', left: leftLine, right: rightLine })
        } else {
          lines.push({ type: 'changed', left: leftLine, right: rightLine })
        }
        continue
      }

      if (!aPrim && !bPrim) {
        const openLeft = formatKeyValueLine(indent, key, aVal)
        const openRight = formatKeyValueLine(indent, key, bVal)
        lines.push({ type: 'unchanged', left: openLeft, right: openRight })
        const inner = structuralDiffValue(aVal, bVal, indent + 1)
        lines.push(...inner)
        const sp = pad(indent)
        lines.push({ type: 'unchanged', left: sp + '}', right: sp + '}' })
        continue
      }

      if (!aPrim && bPrim) {
        const closeLeft = pad(indent) + '}'
        const openLeft = formatKeyValueLine(indent, key, aVal)
        lines.push({ type: 'remove', left: openLeft })
        lines.push(...objectLines(aVal as { [key: string]: JsonValue }, indent + 1).map((l) => ({ type: 'remove' as const, left: l })))
        lines.push({ type: 'remove', left: closeLeft })
        const rightLine = formatKeyValueLine(indent, key, bVal)
        lines.push({ type: 'add', right: rightLine })
        continue
      }

      if (aPrim && !bPrim) {
        const leftLine = formatKeyValueLine(indent, key, aVal)
        lines.push({ type: 'remove', left: leftLine })
        const openRight = formatKeyValueLine(indent, key, bVal)
        lines.push({ type: 'add', right: openRight })
        lines.push(...objectLines(bVal as { [key: string]: JsonValue }, indent + 1).map((l) => ({ type: 'add' as const, right: l })))
        lines.push({ type: 'add', right: pad(indent) + '}' })
        continue
      }
    }

    if (inA) {
      for (const line of formatKeyValueLines(key, a[key], indent)) {
        lines.push({ type: 'remove', left: line })
      }
    } else {
      for (const line of formatKeyValueLines(key, b[key], indent)) {
        lines.push({ type: 'add', right: line })
      }
    }
  }
  return lines
}

function structuralDiffArray(a: JsonValue[], b: JsonValue[], indent: number): DiffLine[] {
  const lines: DiffLine[] = []
  const sp = pad(indent + 1)
  const maxLen = Math.max(a.length, b.length)
  for (let i = 0; i < maxLen; i++) {
    const aHas = i < a.length
    const bHas = i < b.length
    if (aHas && bHas) {
      const inner = structuralDiffValue(a[i], b[i], indent + 1)
      if (inner.length === 0) {
        const aStr = JSON.stringify(a[i])
        lines.push({ type: 'unchanged', left: `${sp}${aStr}`, right: `${sp}${aStr}` })
      } else if (inner.length === 1 && inner[0].type === 'changed') {
        lines.push({ type: 'changed', left: `${sp}${inner[0].left}`, right: `${sp}${inner[0].right}` })
      } else {
        lines.push(...inner)
      }
      continue
    }
    if (aHas) {
      lines.push(...formatValueLines(a[i], indent + 1).map((l) => ({ type: 'remove' as const, left: l })))
    } else {
      lines.push(...formatValueLines(b[i], indent + 1).map((l) => ({ type: 'add' as const, right: l })))
    }
  }
  return lines
}

/**
 * Compare two JSON strings (after normalizing) using structure-aware diff.
 * Same key with different value appears on one row (type: 'changed').
 * Left column = A, right column = B.
 */
export function diffJsonStrings(leftInput: string, rightInput: string): DiffResult {
  const leftResult = tryParseAndNormalize(leftInput)
  const rightResult = tryParseAndNormalize(rightInput)

  if ('error' in leftResult) return { kind: 'parseError', message: leftResult.error, side: 'left' }
  if ('error' in rightResult) return { kind: 'parseError', message: rightResult.error, side: 'right' }

  const a = JSON.parse(leftResult.normalized) as JsonValue
  const b = JSON.parse(rightResult.normalized) as JsonValue

  const lines: DiffLine[] = []
  const aPrim = isPrimitive(a)
  const bPrim = isPrimitive(b)

  if (aPrim && bPrim) {
    if (JSON.stringify(a) === JSON.stringify(b)) {
      lines.push({ type: 'unchanged', left: JSON.stringify(a), right: JSON.stringify(b) })
    } else {
      lines.push({ type: 'changed', left: JSON.stringify(a), right: JSON.stringify(b) })
    }
  } else if (!aPrim && !bPrim && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    lines.push({ type: 'unchanged', left: '{', right: '{' })
    lines.push(...structuralDiffObject(a as { [key: string]: JsonValue }, b as { [key: string]: JsonValue }, 0))
    lines.push({ type: 'unchanged', left: '}', right: '}' })
  } else if (!aPrim && !bPrim && Array.isArray(a) && Array.isArray(b)) {
    lines.push({ type: 'unchanged', left: '[', right: '[' })
    lines.push(...structuralDiffArray(a, b, 0))
    lines.push({ type: 'unchanged', left: ']', right: ']' })
  } else {
    const leftLines = aPrim ? [JSON.stringify(a)] : (Array.isArray(a) ? ['[', ...a.flatMap((v) => formatValueLines(v, 1)), ']'] : ['{', ...objectLines(a as { [key: string]: JsonValue }, 0), '}'])
    const rightLines = bPrim ? [JSON.stringify(b)] : (Array.isArray(b) ? ['[', ...b.flatMap((v) => formatValueLines(v, 1)), ']'] : ['{', ...objectLines(b as { [key: string]: JsonValue }, 0), '}'])
    for (const line of leftLines) lines.push({ type: 'remove', left: line })
    for (const line of rightLines) lines.push({ type: 'add', right: line })
  }

  return { kind: 'ok', lines }
}
