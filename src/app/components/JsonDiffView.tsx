import { useState, useMemo, useRef, useCallback } from 'react';
import { diffJsonStrings, tryParseAndNormalize, type DiffLine } from '../utils/diffJson';
import { readJsonFile } from '../utils/fileDrop';

const DEFAULT_LEFT = '{\n  "name": "foo",\n  "count": 1,\n  "type": "new"\n}';
const DEFAULT_RIGHT = '{\n  "name": "bar",\n  "count": 1,\n  "active": true\n}';
const DROP_ERROR_DURATION_MS = 5000;

function DiffLineRow({ line, lineNumber }: { line: DiffLine; lineNumber: number }) {
  if (line.type === 'unchanged') {
    return (
      <div className="diff-line diff-line-unchanged" data-testid="diff-line-unchanged">
        <span className="diff-line-num" aria-hidden="true">{lineNumber}</span>
        <span className="diff-line-content">{line.left}</span>
        <span className="diff-line-num" aria-hidden="true">{lineNumber}</span>
        <span className="diff-line-content">{line.right}</span>
      </div>
    );
  }
  if (line.type === 'changed') {
    return (
      <div className="diff-line diff-line-changed" data-testid="diff-line-changed" role="status" aria-label="Same key, different value">
        <span className="diff-line-num" aria-hidden="true">{lineNumber}</span>
        <span className="diff-line-content">{line.left}</span>
        <span className="diff-line-num" aria-hidden="true">{lineNumber}</span>
        <span className="diff-line-content">{line.right}</span>
      </div>
    );
  }
  if (line.type === 'remove') {
    return (
      <div className="diff-line diff-line-remove" data-testid="diff-line-remove" role="deletion">
        <span className="diff-line-num" aria-hidden="true">{lineNumber}</span>
        <span className="diff-line-content">{line.left}</span>
        <span className="diff-line-num diff-line-num-empty" aria-hidden="true" />
        <span className="diff-line-content diff-line-empty" aria-label="missing in B">—</span>
      </div>
    );
  }
  return (
    <div className="diff-line diff-line-add" data-testid="diff-line-add" role="insertion">
      <span className="diff-line-num diff-line-num-empty" aria-hidden="true" />
      <span className="diff-line-content diff-line-empty" aria-label="missing in A">—</span>
      <span className="diff-line-num" aria-hidden="true">{lineNumber}</span>
      <span className="diff-line-content">{line.right}</span>
    </div>
  );
}

export default function JsonDiffView() {
  const [leftInput, setLeftInput] = useState(DEFAULT_LEFT);
  const [rightInput, setRightInput] = useState(DEFAULT_RIGHT);
  const [leftCopied, setLeftCopied] = useState(false);
  const [rightCopied, setRightCopied] = useState(false);
  const [leftDropError, setLeftDropError] = useState<string | null>(null);
  const [rightDropError, setRightDropError] = useState<string | null>(null);
  const [leftDragging, setLeftDragging] = useState(false);
  const [rightDragging, setRightDragging] = useState(false);
  const leftDropRef = useRef<HTMLDivElement>(null);
  const rightDropRef = useRef<HTMLDivElement>(null);

  const leftParse = useMemo(() => tryParseAndNormalize(leftInput), [leftInput]);
  const rightParse = useMemo(() => tryParseAndNormalize(rightInput), [rightInput]);

  const diffResult = useMemo(
    () => diffJsonStrings(leftInput, rightInput),
    [leftInput, rightInput]
  );

  const showDiff = leftParse && !('error' in leftParse) && rightParse && !('error' in rightParse);

  const handleCopyLeft = async () => {
    try {
      await navigator.clipboard.writeText(leftInput);
      setLeftCopied(true);
      setTimeout(() => setLeftCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyRight = async () => {
    try {
      await navigator.clipboard.writeText(rightInput);
      setRightCopied(true);
      setTimeout(() => setRightCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleLeftDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setLeftDragging(true);
  }, []);

  const handleLeftDragLeave = useCallback((e: React.DragEvent) => {
    const target = leftDropRef.current;
    if (target && !target.contains(e.relatedTarget as Node)) {
      setLeftDragging(false);
    }
  }, []);

  const handleLeftDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setLeftDragging(false);
    setLeftDropError(null);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const result = await readJsonFile(file);
    if ('content' in result) {
      setLeftInput(result.content);
    } else {
      setLeftDropError(result.error);
      setTimeout(() => setLeftDropError(null), DROP_ERROR_DURATION_MS);
    }
  }, []);

  const handleRightDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setRightDragging(true);
  }, []);

  const handleRightDragLeave = useCallback((e: React.DragEvent) => {
    const target = rightDropRef.current;
    if (target && !target.contains(e.relatedTarget as Node)) {
      setRightDragging(false);
    }
  }, []);

  const handleRightDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setRightDragging(false);
    setRightDropError(null);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const result = await readJsonFile(file);
    if ('content' in result) {
      setRightInput(result.content);
    } else {
      setRightDropError(result.error);
      setTimeout(() => setRightDropError(null), DROP_ERROR_DURATION_MS);
    }
  }, []);

  return (
    <>
      <div className="pane diff-input-pane" aria-label="A Input">
        <div className="pane-header">
          <span className="pane-title">A</span>
          <div className="pane-action-buttons">
            <button
              type="button"
              className={`pane-action-btn copy-btn ${leftCopied ? 'copied' : ''}`}
              onClick={handleCopyLeft}
              aria-label={leftCopied ? 'Copied!' : 'Copy'}
              title="Copy"
            >
              <i className="fa-solid fa-copy" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="pane-action-btn"
              onClick={() => setLeftInput('')}
              aria-label="Clear"
              title="Clear"
            >
              <i className="fa-solid fa-eraser" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div
          ref={leftDropRef}
          className={`pane-body ${leftDragging ? 'drag-over' : ''}`}
          onDragOver={handleLeftDragOver}
          onDragLeave={handleLeftDragLeave}
          onDrop={handleLeftDrop}
          aria-label="A input; drop a .json or .txt file"
          data-testid="diff-drop-zone-a"
        >
          {leftDropError && (
            <div className="parse-error" role="alert" aria-live="polite">
              {leftDropError}
            </div>
          )}
          {'error' in leftParse && (
            <div className="parse-error" role="alert">{leftParse.error}</div>
          )}
          <textarea
            className="raw-textarea"
            placeholder='{"key": "value"}'
            value={leftInput}
            onChange={(e) => {
              setLeftInput(e.target.value);
              if (leftDropError) setLeftDropError(null);
            }}
            spellCheck={false}
            aria-label="A Input"
          />
        </div>
      </div>
      <div className="pane diff-input-pane" aria-label="B Input">
        <div className="pane-header">
          <span className="pane-title">B</span>
          <div className="pane-action-buttons">
            <button
              type="button"
              className={`pane-action-btn copy-btn ${rightCopied ? 'copied' : ''}`}
              onClick={handleCopyRight}
              aria-label={rightCopied ? 'Copied!' : 'Copy'}
              title="Copy"
            >
              <i className="fa-solid fa-copy" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="pane-action-btn"
              onClick={() => setRightInput('')}
              aria-label="Clear"
              title="Clear"
            >
              <i className="fa-solid fa-eraser" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div
          ref={rightDropRef}
          className={`pane-body ${rightDragging ? 'drag-over' : ''}`}
          onDragOver={handleRightDragOver}
          onDragLeave={handleRightDragLeave}
          onDrop={handleRightDrop}
          aria-label="B input; drop a .json or .txt file"
          data-testid="diff-drop-zone-b"
        >
          {rightDropError && (
            <div className="parse-error" role="alert" aria-live="polite">
              {rightDropError}
            </div>
          )}
          {'error' in rightParse && (
            <div className="parse-error" role="alert">{rightParse.error}</div>
          )}
          <textarea
            className="raw-textarea"
            placeholder='{"key": "value"}'
            value={rightInput}
            onChange={(e) => {
              setRightInput(e.target.value);
              if (rightDropError) setRightDropError(null);
            }}
            spellCheck={false}
            aria-label="B Input"
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
              {diffResult.side === 'left' ? 'A: ' : 'B: '}{diffResult.message}
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
  );
}
