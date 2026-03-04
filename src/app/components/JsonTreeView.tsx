import { useState, useCallback } from 'react';
import type { JsonValue, TreeEditPath } from '../types';

type JsonTreeViewProps = {
  parsed: JsonValue | null
  onTreeEdit: (path: TreeEditPath, value: JsonValue) => void
}

function isPrimitive(value: unknown): value is string | number | boolean | null {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

type TreeNodeProps = {
  path: TreeEditPath
  keyLabel: string | number
  value: JsonValue
  onEdit: (path: TreeEditPath, value: JsonValue) => void
}

function TreeNode({ path, keyLabel, value, onEdit }: TreeNodeProps) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(
    value === null ? 'null' : String(value)
  );
  const [expanded, setExpanded] = useState(true);
  const isArray = Array.isArray(value);

  const commitEdit = useCallback(
    (raw: string) => {
      setEditing(false);
      const trimmed = raw.trim();
      if (value === null && trimmed === 'null') return;
      if (typeof value === 'boolean' && (trimmed === 'true' || trimmed === 'false')) {
        onEdit(path, trimmed === 'true');
        return;
      }
      if (typeof value === 'number' && trimmed !== '') {
        const n = Number(trimmed);
        if (!Number.isNaN(n)) {
          onEdit(path, n);
          return;
        }
      }
      if (typeof value === 'string' || (value === null && trimmed !== 'null')) {
        if (trimmed === 'null') {
          onEdit(path, null);
          return;
        }
        onEdit(path, trimmed);
        return;
      }
      if (typeof value === 'number' && trimmed === '') return;
      const n = Number(trimmed);
      if (!Number.isNaN(n)) onEdit(path, n);
      else onEdit(path, trimmed);
    },
    [path, value, onEdit]
  );

  if (isPrimitive(value)) {
    const displayVal = value === null ? 'null' : String(value);
    const valueClass =
      value === null
        ? 'tree-value-null'
        : typeof value === 'boolean'
          ? 'tree-value-bool'
          : 'tree-value-display';

    if (editing) {
      return (
        <div className="tree-node">
          <div className="tree-node-inner">
            <span className="tree-key">{JSON.stringify(String(keyLabel))}:</span>
            <input
              className="tree-value-input"
              autoFocus
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={() => commitEdit(inputVal)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit(inputVal);
                if (e.key === 'Escape') {
                  setInputVal(displayVal);
                  setEditing(false);
                }
              }}
              data-testid={`tree-edit-${path.join('-')}`}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="tree-node">
        <div
          className="tree-node-inner"
          role="button"
          tabIndex={0}
          onClick={() => setEditing(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setEditing(true);
            }
          }}
        >
          <span className="tree-key">{JSON.stringify(String(keyLabel))}:</span>
          <span className={valueClass}>{displayVal}</span>
        </div>
      </div>
    );
  }

  const entries = isArray
    ? (value as JsonValue[]).map((v, i) => ({ key: i, value: v }))
    : Object.entries(value as Record<string, JsonValue>).map(([key, v]) => ({
        key,
        value: v,
      }));

  return (
    <div className="tree-node">
      <div className="tree-node-inner">
        <button
          type="button"
          className="tree-toggle"
          onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '▼' : '▶'}
        </button>
        <span
          className={isArray ? 'tree-key-array' : 'tree-key'}
        >
          {JSON.stringify(String(keyLabel))}:
        </span>
        <span className="tree-value-display">
          {isArray ? `[${entries.length}]` : `{${entries.length}}`}
        </span>
      </div>
      {expanded && (
        <div className="tree-children">
          {entries.map(({ key, value: childValue }) => (
            <TreeNode
              key={String(key)}
              path={[...path, key]}
              keyLabel={key}
              value={childValue}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function JsonTreeView({ parsed, onTreeEdit }: JsonTreeViewProps) {
  if (parsed === null) {
    return <div className="empty-state">Enter valid JSON to edit as tree.</div>;
  }

  if (isPrimitive(parsed)) {
    return (
      <div className="tree-root">
        <TreeNode
          path={[]}
          keyLabel="(root)"
          value={parsed}
          onEdit={onTreeEdit}
        />
      </div>
    );
  }

  const isArray = Array.isArray(parsed);
  const entries = isArray
    ? (parsed as JsonValue[]).map((v, i) => ({ key: i, value: v }))
    : Object.entries(parsed as Record<string, JsonValue>).map(([key, v]) => ({
        key,
        value: v,
      }));

  return (
    <div className="tree-root">
      {entries.map(({ key, value }) => (
        <TreeNode
          key={String(key)}
          path={[key]}
          keyLabel={key}
          value={value}
          onEdit={onTreeEdit}
        />
      ))}
    </div>
  );
}
