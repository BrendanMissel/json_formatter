import { useState, useMemo } from 'react'
import { diffJsonStrings, tryParseAndNormalize, type DiffLine } from '../utils/diffJson'

const DEFAULT_LEFT = '{\n  "name": "foo",\n  "count": 1\n}'
const DEFAULT_RIGHT = '{\n  "name": "bar",\n  "count": 2,\n  "active": true\n}'

function DiffLineRow({ line, lineNumber }: { line: DiffLine; lineNumber: number }) {
  if (line.type === 'unchanged') {
    return (
      <div className="diff-line diff-line-unchanged" data-testid="diff-line-unchanged">
        <span className="diff-line-num" aria-hidden="true">{lineNumber}</span>
        <span className="diff-line-content">{line.left}</span>
        <span className="diff-line-num" aria-hidden="true">{lineNumber}</span>
        <span className="diff-line-content">{line.right}</span>
      </div>
    )
  }
  if (line.type === 'changed') {
    return (
      <div className="diff-line diff-line-changed" data-testid="diff-line-changed" role="status" aria-label="Same key, different value">
        <span className="diff-line-num" aria-hidden="true">{lineNumber}</span>
        <span className="diff-line-content">{line.left}</span>
        <span className="diff-line-num" aria-hidden="true">{lineNumber}</span>
        <span className="diff-line-content">{line.right}</span>
      </div>
    )
  }
  if (line.type === 'remove') {
    return (
      <div className="diff-line diff-line-remove" data-testid="diff-line-remove" role="deletion">
        <span className="diff-line-num" aria-hidden="true">{lineNumber}</span>
        <span className="diff-line-content">{line.left}</span>
        <span className="diff-line-num diff-line-num-empty" aria-hidden="true" />
        <span className="diff-line-content diff-line-empty" aria-label="missing in B">—</span>
      </div>
    )
  }
  return (
    <div className="diff-line diff-line-add" data-testid="diff-line-add" role="insertion">
      <span className="diff-line-num diff-line-num-empty" aria-hidden="true" />
      <span className="diff-line-content diff-line-empty" aria-label="missing in A">—</span>
      <span className="diff-line-num" aria-hidden="true">{lineNumber}</span>
      <span className="diff-line-content">{line.right}</span>
    </div>
  )
}

export default function JsonDiffView() {
  const [leftInput, setLeftInput] = useState(DEFAULT_LEFT)
  const [rightInput, setRightInput] = useState(DEFAULT_RIGHT)

  const leftParse = useMemo(() => tryParseAndNormalize(leftInput), [leftInput])
  const rightParse = useMemo(() => tryParseAndNormalize(rightInput), [rightInput])

  const diffResult = useMemo(
    () => diffJsonStrings(leftInput, rightInput),
    [leftInput, rightInput]
  )

  const showDiff = leftParse && !('error' in leftParse) && rightParse && !('error' in rightParse)

  return (
    <>
      <div className="pane diff-input-pane" aria-label="JSON A">
        <div className="pane-header">
          <span className="pane-title">JSON A</span>
        </div>
        <div className="pane-body">
          {'error' in leftParse && (
            <div className="parse-error" role="alert">{leftParse.error}</div>
          )}
          <textarea
            className="raw-textarea"
            placeholder='{"key": "value"}'
            value={leftInput}
            onChange={(e) => setLeftInput(e.target.value)}
            spellCheck={false}
            aria-label="JSON A input"
          />
        </div>
      </div>
      <div className="pane diff-input-pane" aria-label="JSON B">
        <div className="pane-header">
          <span className="pane-title">JSON B</span>
        </div>
        <div className="pane-body">
          {'error' in rightParse && (
            <div className="parse-error" role="alert">{rightParse.error}</div>
          )}
          <textarea
            className="raw-textarea"
            placeholder='{"key": "value"}'
            value={rightInput}
            onChange={(e) => setRightInput(e.target.value)}
            spellCheck={false}
            aria-label="JSON B input"
          />
        </div>
      </div>
      <div className="pane diff-output-pane" role="region" aria-label="JSON diff result">
        <div className="pane-header">
          <span className="pane-title">Diff (A → B)</span>
        </div>
        <div className="pane-body diff-output-body">
          {!showDiff && diffResult.kind === 'parseError' && (
            <div className="parse-error" role="alert">
              {diffResult.side === 'left' ? 'JSON A: ' : 'JSON B: '}{diffResult.message}
            </div>
          )}
          {showDiff && diffResult.kind === 'ok' && (
            <pre className="diff-pre" data-testid="diff-output">
              {diffResult.lines.map((line, i) => (
                <DiffLineRow key={i} line={line} lineNumber={i + 1} />
              ))}
            </pre>
          )}
          {showDiff && diffResult.kind === 'ok' && diffResult.lines.length === 0 && (
            <div className="empty-state">No differences (after normalizing).</div>
          )}
        </div>
      </div>
    </>
  )
}
