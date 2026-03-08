import { useState } from 'react';
import type { JsonValue, FormatMode, TreeEditPath } from '../types';
import FormattedJsonView from './FormattedJsonView';
import JsonTreeView from './JsonTreeView';

function fileNameFromTabName(tabName: string): string {
  const invalid = /[\\/:*?"<>|]/g;
  const sanitized = (tabName ?? '').trim().replace(invalid, '').trim();
  const base = sanitized || 'format';
  return base.toLowerCase().endsWith('.json') ? base : `${base}.json`;
}

type FormattedPaneProps = {
  parsed: JsonValue | null
  parseError: string | null
  formatMode: FormatMode
  setFormatMode: (m: FormatMode) => void
  onTreeEdit: (path: TreeEditPath, value: JsonValue) => void
  tabName?: string
}

export default function FormattedPane({
  parsed,
  parseError,
  formatMode,
  setFormatMode,
  onTreeEdit,
  tabName,
}: FormattedPaneProps) {
  const [copied, setCopied] = useState(false);

  const formattedString = parsed === null ? '' : JSON.stringify(parsed, null, 2);

  const handleCopyFormatted = async () => {
    try {
      await navigator.clipboard.writeText(formattedString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSave = () => {
    const filename = fileNameFromTabName(tabName ?? '');
    const blob = new Blob([formattedString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pane">
      <div className="pane-header">
        <span className="pane-title">Output</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="mode-toggle">
            <button
              type="button"
              className={formatMode === 'formatted' ? 'active' : ''}
              onClick={() => setFormatMode('formatted')}
            >
              Formatted
            </button>
            <button
              type="button"
              className={formatMode === 'tree' ? 'active' : ''}
              onClick={() => setFormatMode('tree')}
            >
              Tree view
            </button>
          </div>
          <button
            type="button"
            className="pane-action-btn save-btn"
            onClick={handleSave}
            disabled={parsed === null}
            aria-label="Save"
            title="Save"
          >
            <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`pane-action-btn copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopyFormatted}
            disabled={parsed === null}
            aria-label={copied ? 'Copied!' : 'Copy'}
            title="Copy"
          >
            <i className="fa-solid fa-copy" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="pane-body">
        {parseError && <div className="parse-error">{parseError}</div>}
        {formatMode === 'formatted' && <FormattedJsonView parsed={parsed} />}
        {formatMode === 'tree' && (
          <JsonTreeView parsed={parsed} onTreeEdit={onTreeEdit} />
        )}
      </div>
    </div>
  );
}
