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
