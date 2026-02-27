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

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setRawString(text)
    } catch {
      // ignore permission or other errors
    }
  }

  const handleClear = () => {
    setRawString('')
  }

  return (
    <div className="pane">
      <div className="pane-header">
        <span className="pane-title">Input (raw JSON)</span>
        <div className="pane-action-buttons">
          <button
            type="button"
            className={`pane-action-btn copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            aria-label={copied ? 'Copied!' : 'Copy'}
            title="Copy"
          >
            <i className="fa-solid fa-copy" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="pane-action-btn"
            onClick={handlePaste}
            aria-label="Paste"
            title="Paste"
          >
            <i className="fa-solid fa-paste" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="pane-action-btn"
            onClick={handleClear}
            aria-label="Clear"
            title="Clear"
          >
            <i className="fa-solid fa-eraser" aria-hidden="true" />
          </button>
        </div>
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
