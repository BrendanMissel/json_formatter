import type { JsonValue } from '../types'

type FormattedJsonViewProps = {
  parsed: JsonValue | null
}

export default function FormattedJsonView({ parsed }: FormattedJsonViewProps) {
  if (parsed === null) {
    return <div className="empty-state">Enter valid JSON to see formatted output.</div>
  }
  const formatted = JSON.stringify(parsed, null, 2)
  return (
    <pre className="formatted-pre" data-testid="formatted-json">
      {formatted}
    </pre>
  )
}
