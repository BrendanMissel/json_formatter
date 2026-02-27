import { describe, it, expect } from 'vitest'
import { tryParseAndNormalize, diffJsonStrings } from './diffJson'

describe('tryParseAndNormalize', () => {
  it('returns error for empty string', () => {
    expect(tryParseAndNormalize('')).toEqual({ error: 'Enter JSON' })
    expect(tryParseAndNormalize('   ')).toEqual({ error: 'Enter JSON' })
  })

  it('returns normalized formatted JSON for valid input', () => {
    const result = tryParseAndNormalize('{"a":1,"b":2}')
    expect(result).toHaveProperty('normalized')
    expect((result as { normalized: string }).normalized).toBe('{\n  "a": 1,\n  "b": 2\n}')
  })

  it('returns error for invalid JSON', () => {
    const result = tryParseAndNormalize('{ invalid }')
    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toBeTruthy()
  })
})

describe('diffJsonStrings', () => {
  it('returns parseError when left is invalid', () => {
    const result = diffJsonStrings('not json', '{}')
    expect(result.kind).toBe('parseError')
    if (result.kind === 'parseError') {
      expect(result.side).toBe('left')
      expect(result.message).toBeTruthy()
    }
  })

  it('returns parseError when right is invalid', () => {
    const result = diffJsonStrings('{}', 'not json')
    expect(result.kind).toBe('parseError')
    if (result.kind === 'parseError') {
      expect(result.side).toBe('right')
    }
  })

  it('returns ok with unchanged lines when both inputs are identical after normalize', () => {
    const result = diffJsonStrings('{"x":1}', '{"x":1}')
    expect(result.kind).toBe('ok')
    if (result.kind === 'ok') {
      expect(result.lines.length).toBeGreaterThan(0)
      expect(result.lines.every((l) => l.type === 'unchanged')).toBe(true)
    }
  })

  it('returns add and remove lines when inputs differ', () => {
    const left = '{"a": 1}'
    const right = '{"a": 1, "b": 2}'
    const result = diffJsonStrings(left, right)
    expect(result.kind).toBe('ok')
    if (result.kind === 'ok') {
      const hasAdd = result.lines.some((l) => l.type === 'add')
      const hasRemove = result.lines.some((l) => l.type === 'remove')
      expect(hasAdd || hasRemove).toBe(true)
    }
  })

  it('shows same key different value as changed line (one row, both sides)', () => {
    const left = '{"name": "foo"}'
    const right = '{"name": "bar"}'
    const result = diffJsonStrings(left, right)
    expect(result.kind).toBe('ok')
    if (result.kind === 'ok') {
      const changedLines = result.lines.filter((l) => l.type === 'changed')
      expect(changedLines.length).toBeGreaterThan(0)
      expect(changedLines.some((l) => l.type === 'changed' && l.left.includes('foo') && l.right.includes('bar'))).toBe(true)
    }
  })
})
