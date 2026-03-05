import { useState, useRef, useCallback } from 'react';
import { readJsonFile } from '../utils/fileDrop';

type RawInputPaneProps = {
  rawString: string
  setRawString: (s: string) => void
}

const DROP_ERROR_DURATION_MS = 5000;

export default function RawInputPane({ rawString, setRawString }: RawInputPaneProps) {
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const dropTargetRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleClear = () => {
    setRawString('');
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const target = dropTargetRef.current;
    if (target && !target.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setDropError(null);

      const file = e.dataTransfer.files[0];
      if (!file) return;

      const result = await readJsonFile(file);
      if ('content' in result) {
        setRawString(result.content);
      } else {
        setDropError(result.error);
        setTimeout(() => setDropError(null), DROP_ERROR_DURATION_MS);
      }
    },
    [setRawString]
  );

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
            onClick={handleClear}
            aria-label="Clear"
            title="Clear"
          >
            <i className="fa-solid fa-eraser" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        ref={dropTargetRef}
        className={`pane-body ${isDragging ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-label="Input raw JSON; drop a .json or .txt file"
        data-testid="raw-input-drop-zone"
      >
        {dropError && (
          <div className="parse-error" role="alert" aria-live="polite">
            {dropError}
          </div>
        )}
        <textarea
          className="raw-textarea"
          placeholder='{"key": "value"}'
          value={rawString}
          onChange={(e) => {
            setRawString(e.target.value);
            if (dropError) setDropError(null);
          }}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
