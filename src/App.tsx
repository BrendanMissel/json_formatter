import { useEffect, useState, useCallback } from 'react'
import { useDebounce } from './hooks/useDebounce'
import type { JsonValue, FormatMode, TreeEditPath } from './types'
import RawInputPane from './components/RawInputPane'
import FormattedPane from './components/FormattedPane'

const DEFAULT_RAW = '{\n  "example": true,\n  "count": 42\n}\n'
const DEBOUNCE_MS = 350

function setAtPath(obj: unknown, path: TreeEditPath, value: JsonValue): JsonValue {
  if (path.length === 0) return value
  const [head, ...rest] = path
  if (rest.length === 0) {
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      return { ...obj, [String(head)]: value } as JsonValue
    }
    if (Array.isArray(obj)) {
      const arr = [...obj]
      arr[Number(head)] = value
      return arr as JsonValue
    }
    return value
  }
  const parent = typeof obj === 'object' && obj !== null
    ? (Array.isArray(obj) ? obj[Number(head)] : (obj as Record<string, unknown>)[String(head)])
    : undefined
  const child = setAtPath(parent, rest, value)
  if (Array.isArray(obj)) {
    const arr = [...obj]
    arr[Number(head)] = child
    return arr as JsonValue
  }
  if (typeof obj === 'object' && obj !== null) {
    return { ...obj, [String(head)]: child } as JsonValue
  }
  return value
}

export default function App() {
  const [rawString, setRawString] = useState(DEFAULT_RAW)
  const [parsed, setParsed] = useState<JsonValue | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [formatMode, setFormatMode] = useState<FormatMode>('formatted')

  const debouncedRaw = useDebounce(rawString, DEBOUNCE_MS)

  useEffect(() => {
    const trimmed = debouncedRaw.trim()
    if (trimmed === '') {
      setParseError('Enter JSON')
      setParsed(null)
      return
    }
    try {
      const value = JSON.parse(trimmed) as JsonValue
      setParsed(value)
      setParseError(null)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON')
      // keep last valid parsed state
    }
  }, [debouncedRaw])

  const onTreeEdit = useCallback((path: TreeEditPath, newValue: JsonValue) => {
    if (parsed === null) return
    const next = setAtPath(parsed, path, newValue)
    setParsed(next)
    setRawString(JSON.stringify(next, null, 2))
  }, [parsed])

  return (
    <div className="app">
      <header className="app-header">JSON Formatter</header>
      <div className="panes">
        <RawInputPane rawString={rawString} setRawString={setRawString} />
        <FormattedPane
          parsed={parsed}
          parseError={parseError}
          formatMode={formatMode}
          setFormatMode={setFormatMode}
          onTreeEdit={onTreeEdit}
        />
      </div>
    </div>
  )
}
