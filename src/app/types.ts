export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type FormatMode = 'formatted' | 'tree';

export type AppMode = 'format' | 'diff';

export type TreeEditPath = (string | number)[];

export type TabItem = {
  id: string;
  type: 'format' | 'diff';
  name: string;
};

export type FormatTabState = {
  rawString: string;
  formatMode: FormatMode;
  parsed: JsonValue | null;
  parseError: string | null;
};

export type DiffTabState = {
  leftInput: string;
  rightInput: string;
};
