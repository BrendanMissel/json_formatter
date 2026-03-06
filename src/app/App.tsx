import { useEffect, useState, useCallback, useRef } from 'react';
import { useDebounce } from './hooks/useDebounce';
import type { JsonValue, FormatMode, TreeEditPath, TabItem, FormatTabState, DiffTabState } from './types';
import RawInputPane from './components/RawInputPane';
import FormattedPane from './components/FormattedPane';
import JsonDiffView, { DEFAULT_LEFT as DIFF_DEFAULT_LEFT, DEFAULT_RIGHT as DIFF_DEFAULT_RIGHT } from './components/JsonDiffView';
import githubIconUrl from './assets/GitHub_Invertocat_White_Clearspace.svg';

const DEFAULT_RAW = '{\n  "example": true,\n  "count": 42\n}\n';
const DEBOUNCE_MS = 350;
const TABPANEL_ID = 'app-tabpanel';

function parseInitial(raw: string): { parsed: JsonValue | null; parseError: string | null } {
  const trimmed = raw.trim();
  if (trimmed === '') return { parsed: null, parseError: 'Enter JSON' };
  try {
    return { parsed: JSON.parse(trimmed) as JsonValue, parseError: null };
  } catch (e) {
    return { parsed: null, parseError: e instanceof Error ? e.message : 'Invalid JSON' };
  }
}

const initialParsed = parseInitial(DEFAULT_RAW);

function createFormatTabState(): FormatTabState {
  return {
    rawString: DEFAULT_RAW,
    formatMode: 'formatted',
    parsed: initialParsed.parsed,
    parseError: initialParsed.parseError,
  };
}

function createDiffTabState(): DiffTabState {
  return {
    leftInput: DIFF_DEFAULT_LEFT,
    rightInput: DIFF_DEFAULT_RIGHT,
  };
}

function defaultTabName(tabs: TabItem[], type: 'format' | 'diff'): string {
  const count = tabs.filter((t) => t.type === type).length;
  return count === 0 ? (type === 'format' ? 'Format' : 'Diff') : `${type === 'format' ? 'Format' : 'Diff'} ${count + 1}`;
}

function setAtPath(obj: unknown, path: TreeEditPath, value: JsonValue): JsonValue {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (rest.length === 0) {
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      return { ...obj, [String(head)]: value } as JsonValue;
    }
    if (Array.isArray(obj)) {
      const arr = [...obj];
      arr[Number(head)] = value;
      return arr as JsonValue;
    }
    return value;
  }
  const parent = typeof obj === 'object' && obj !== null
    ? (Array.isArray(obj) ? obj[Number(head)] : (obj as Record<string, unknown>)[String(head)])
    : undefined;
  const child = setAtPath(parent, rest, value);
  if (Array.isArray(obj)) {
    const arr = [...obj];
    arr[Number(head)] = child;
    return arr as JsonValue;
  }
  if (typeof obj === 'object' && obj !== null) {
    return { ...obj, [String(head)]: child } as JsonValue;
  }
  return value;
}

const initialFormatId = crypto.randomUUID();
const initialDiffId = crypto.randomUUID();

const initialTabs: TabItem[] = [
  { id: initialFormatId, type: 'format', name: 'Format' },
  { id: initialDiffId, type: 'diff', name: 'Diff' },
];

const initialFormatState: Record<string, FormatTabState> = {
  [initialFormatId]: createFormatTabState(),
};
const initialDiffState: Record<string, DiffTabState> = {
  [initialDiffId]: createDiffTabState(),
};

export default function App() {
  const [tabs, setTabs] = useState<TabItem[]>(initialTabs);
  const [activeTabId, setActiveTabId] = useState<string>(initialFormatId);
  const [formatState, setFormatState] = useState<Record<string, FormatTabState>>(initialFormatState);
  const [diffState, setDiffState] = useState<Record<string, DiffTabState>>(initialDiffState);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const activeFormatState = activeTab?.type === 'format' ? formatState[activeTab.id] : undefined;
  const debouncedRaw = useDebounce(activeFormatState?.rawString ?? '', DEBOUNCE_MS);

  useEffect(() => {
    if (activeTab?.type !== 'format' || !activeTab) return;
    const trimmed = debouncedRaw.trim();
    if (trimmed === '') {
      setFormatState((prev) => ({
        ...prev,
        [activeTab.id]: {
          ...prev[activeTab.id],
          parsed: null,
          parseError: 'Enter JSON',
        },
      }));
      return;
    }
    try {
      const value = JSON.parse(trimmed) as JsonValue;
      setFormatState((prev) => ({
        ...prev,
        [activeTab.id]: {
          ...prev[activeTab.id],
          parsed: value,
          parseError: null,
        },
      }));
    } catch (e) {
      setFormatState((prev) => ({
        ...prev,
        [activeTab.id]: {
          ...prev[activeTab.id],
          parseError: e instanceof Error ? e.message : 'Invalid JSON',
        },
      }));
    }
  }, [debouncedRaw, activeTab?.id, activeTab?.type]);

  useEffect(() => {
    if (!addMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [addMenuOpen]);

  const onTreeEdit = useCallback(
    (path: TreeEditPath, newValue: JsonValue) => {
      if (activeTab?.type !== 'format') return;
      const state = formatState[activeTab.id];
      if (!state || state.parsed === null) return;
      const next = setAtPath(state.parsed, path, newValue);
      const rawString = JSON.stringify(next, null, 2);
      setFormatState((prev) => ({
        ...prev,
        [activeTab.id]: {
          ...prev[activeTab.id],
          rawString,
          parsed: next,
          parseError: null,
        },
      }));
    },
    [activeTab?.id, activeTab?.type, formatState]
  );

  const addTab = useCallback((type: 'format' | 'diff') => {
    const id = crypto.randomUUID();
    const name = defaultTabName(tabs, type);
    setTabs((prev) => [...prev, { id, type, name }]);
    if (type === 'format') {
      setFormatState((prev) => ({ ...prev, [id]: createFormatTabState() }));
    } else {
      setDiffState((prev) => ({ ...prev, [id]: createDiffTabState() }));
    }
    setActiveTabId(id);
    setAddMenuOpen(false);
  }, [tabs]);

  const closeTab = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length <= 1) return;
    const index = tabs.findIndex((t) => t.id === id);
    if (index === -1) return;
    const nextTabs = tabs.filter((t) => t.id !== id);
    const newActiveId =
      activeTabId === id
        ? nextTabs[Math.max(0, index - 1)]?.id ?? nextTabs[0]?.id
        : activeTabId;
    setTabs(nextTabs);
    setFormatState((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setDiffState((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setActiveTabId(newActiveId);
    if (editingTabId === id) setEditingTabId(null);
  }, [tabs, activeTabId, editingTabId]);

  const startRename = useCallback((tab: TabItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tab.type !== 'format') return;
    setEditingTabId(tab.id);
    setEditingName(tab.name);
  }, []);

  const commitRename = useCallback(() => {
    if (editingTabId == null) return;
    const name = editingName.trim() || 'Format';
    setTabs((prev) =>
      prev.map((t) => (t.id === editingTabId ? { ...t, name } : t))
    );
    setEditingTabId(null);
  }, [editingTabId, editingName]);

  const setActiveFormatRaw = useCallback(
    (rawString: string) => {
      if (activeTab?.type !== 'format') return;
      setFormatState((prev) => ({
        ...prev,
        [activeTab.id]: { ...prev[activeTab.id], rawString },
      }));
    },
    [activeTab?.id, activeTab?.type]
  );

  const setActiveFormatMode = useCallback(
    (formatMode: FormatMode) => {
      if (activeTab?.type !== 'format') return;
      setFormatState((prev) => ({
        ...prev,
        [activeTab.id]: { ...prev[activeTab.id], formatMode },
      }));
    },
    [activeTab?.id, activeTab?.type]
  );

  const setActiveDiffLeft = useCallback(
    (leftInput: string) => {
      if (activeTab?.type !== 'diff') return;
      setDiffState((prev) => ({
        ...prev,
        [activeTab.id]: { ...prev[activeTab.id], leftInput },
      }));
    },
    [activeTab?.id, activeTab?.type]
  );

  const setActiveDiffRight = useCallback(
    (rightInput: string) => {
      if (activeTab?.type !== 'diff') return;
      setDiffState((prev) => ({
        ...prev,
        [activeTab.id]: { ...prev[activeTab.id], rightInput },
      }));
    },
    [activeTab?.id, activeTab?.type]
  );

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-header-title">JSON Tools</span>
        <div className="app-tabs" role="tablist" aria-label="Tabs">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              role="presentation"
              className={`app-tab ${activeTabId === tab.id ? 'active' : ''}`}
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTabId === tab.id}
                aria-controls={TABPANEL_ID}
                id={`tab-${tab.id}`}
                className="app-tab-trigger"
                onClick={() => setActiveTabId(tab.id)}
              >
                {editingTabId === tab.id && tab.type === 'format' ? (
                  <input
                    type="text"
                    className="app-tab-rename-input"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') {
                        setEditingTabId(null);
                        setEditingName(tab.name);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Rename tab"
                    autoFocus
                  />
                ) : (
                  <span className="app-tab-label">{tab.name}</span>
                )}
              </button>
              {tab.type === 'format' && editingTabId !== tab.id && (
                <button
                  type="button"
                  className="app-tab-action"
                  onClick={(e) => startRename(tab, e)}
                  aria-label={`Rename ${tab.name}`}
                  title="Rename tab"
                >
                  <i className="fa-solid fa-pen" aria-hidden="true" />
                </button>
              )}
              {tabs.length > 1 && (
                <button
                  type="button"
                  className="app-tab-action app-tab-close"
                  onClick={(e) => closeTab(tab.id, e)}
                  aria-label={`Close ${tab.name}`}
                  title="Close tab"
                >
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
          <div className="app-tab-add-wrap" ref={addMenuRef}>
            <button
              type="button"
              className="app-tab-add"
              onClick={() => setAddMenuOpen((o) => !o)}
              aria-label="Add tab"
              aria-expanded={addMenuOpen}
              aria-haspopup="menu"
            >
              <i className="fa-solid fa-plus" aria-hidden="true" />
            </button>
            {addMenuOpen && (
              <div className="app-tab-add-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => addTab('format')}
                >
                  Add Format tab
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => addTab('diff')}
                >
                  Add Diff tab
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="app-header-github">
          <a
            href="https://github.com/BrendanMissel/json_formatter"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View repository on GitHub"
            className="github-link"
          >
            <img src={githubIconUrl} alt="" width={24} height={24} aria-hidden="true" />
          </a>
        </div>
      </header>
      {activeTab && (
        <div
          key={activeTabId}
          id={TABPANEL_ID}
          className={activeTab.type === 'diff' ? 'panes diff-panes' : 'panes'}
          role="tabpanel"
          aria-labelledby={`tab-${activeTabId}`}
        >
          {activeTab.type === 'format' && activeFormatState && (
            <>
              <RawInputPane
                rawString={activeFormatState.rawString}
                setRawString={setActiveFormatRaw}
              />
              <FormattedPane
                parsed={activeFormatState.parsed}
                parseError={activeFormatState.parseError}
                formatMode={activeFormatState.formatMode}
                setFormatMode={setActiveFormatMode}
                onTreeEdit={onTreeEdit}
              />
            </>
          )}
          {activeTab.type === 'diff' && diffState[activeTab.id] && (
            <JsonDiffView
              leftInput={diffState[activeTab.id].leftInput}
              setLeftInput={setActiveDiffLeft}
              rightInput={diffState[activeTab.id].rightInput}
              setRightInput={setActiveDiffRight}
            />
          )}
        </div>
      )}
    </div>
  );
}
