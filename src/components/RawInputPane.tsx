import { useState } from 'react'

type RawInputPaneProps = {
  rawString: string
  setRawString: (s: string) => void
}

export default function RawInputPane({ rawString, setRawString }: RawInputPaneProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="pane">
      <div className="pane-header">
        <span className="pane-title">Input (raw JSON)</span>
        <button
          type="button"
          className={`copy-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="pane-body">
        <textarea
          className="raw-textarea"
          placeholder='{"key": "value"}'
          value={rawString}
          onChange={(e) => setRawString(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  )
}
