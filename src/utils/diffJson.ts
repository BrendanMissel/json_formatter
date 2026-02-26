import { diffLines, type Change } from 'diff'
import type { JsonValue } from '../types'

export type DiffLine =
  | { type: 'unchanged'; left: string; right: string }
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

/**
 * Compare two JSON strings (after normalizing) and return a list of diff lines
 * for side-by-side rendering. Left column = "old" (A), right column = "new" (B).
 */
export function diffJsonStrings(leftInput: string, rightInput: string): DiffResult {
  const leftResult = tryParseAndNormalize(leftInput)
  const rightResult = tryParseAndNormalize(rightInput)

  if ('error' in leftResult) return { kind: 'parseError', message: leftResult.error, side: 'left' }
  if ('error' in rightResult) return { kind: 'parseError', message: rightResult.error, side: 'right' }

  const leftStr = leftResult.normalized
  const rightStr = rightResult.normalized

  const changes = diffLines(leftStr, rightStr)
  const lines: DiffLine[] = []

  for (const change of changes as Change[]) {
    const value = change.value ?? ''
    const parts = value.split('\n')
    if (parts.length > 1 && parts[parts.length - 1] === '') parts.pop()
    for (const line of parts) {
      if (change.added) {
        lines.push({ type: 'add', right: line })
      } else if (change.removed) {
        lines.push({ type: 'remove', left: line })
      } else {
        lines.push({ type: 'unchanged', left: line, right: line })
      }
    }
  }

  return { kind: 'ok', lines }
}
