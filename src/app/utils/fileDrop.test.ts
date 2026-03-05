import { describe, it, expect } from 'vitest';
import { readJsonFile } from './fileDrop';

describe('readJsonFile', () => {
  it('returns content for .json file with valid JSON', async () => {
    const file = new File(['{"a": 1, "b": 2}'], 'data.json', {
      type: 'application/json'
    });
    const result = await readJsonFile(file);
    expect(result).toEqual({ content: '{"a": 1, "b": 2}' });
  });

  it('returns content for .txt file with valid JSON', async () => {
    const file = new File(['{"x": true}'], 'data.txt', { type: 'text/plain' });
    const result = await readJsonFile(file);
    expect(result).toEqual({ content: '{"x": true}' });
  });

  it('accepts .JSON and .TXT case-insensitively', async () => {
    const fileUpper = new File(['{}'], 'data.JSON', { type: 'application/json' });
    expect(await readJsonFile(fileUpper)).toEqual({ content: '{}' });

    const fileTxt = new File(['[]'], 'data.TXT', { type: 'text/plain' });
    expect(await readJsonFile(fileTxt)).toEqual({ content: '[]' });
  });

  it('returns error for unsupported file type', async () => {
    const file = new File(['{"a": 1}'], 'data.csv', { type: 'text/csv' });
    const result = await readJsonFile(file);
    expect(result).toEqual({
      error: 'Unsupported file type. Use .json or .txt.'
    });
  });

  it('returns error for .json file with invalid JSON', async () => {
    const file = new File(['{ invalid }'], 'data.json', {
      type: 'application/json'
    });
    const result = await readJsonFile(file);
    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toMatch(/Invalid JSON/);
  });

  it('returns error for empty file', async () => {
    const file = new File([''], 'empty.json', { type: 'application/json' });
    const result = await readJsonFile(file);
    expect(result).toEqual({
      error: 'File is empty or contains only whitespace.'
    });
  });

  it('returns error for whitespace-only file', async () => {
    const file = new File(['   \n\t  '], 'blank.txt', { type: 'text/plain' });
    const result = await readJsonFile(file);
    expect(result).toEqual({
      error: 'File is empty or contains only whitespace.'
    });
  });
});
