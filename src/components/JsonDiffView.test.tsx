import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JsonDiffView from './JsonDiffView';

describe('JsonDiffView', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(''),
      },
    });
  });

  it('renders Copy, Paste, and Clear buttons for JSON A and JSON B', () => {
    render(<JsonDiffView />);
    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    const pasteButtons = screen.getAllByRole('button', { name: /paste/i });
    const clearButtons = screen.getAllByRole('button', { name: /clear/i });
    expect(copyButtons).toHaveLength(2);
    expect(pasteButtons).toHaveLength(2);
    expect(clearButtons).toHaveLength(2);
  });

  it('Paste in JSON A updates the JSON A textarea', async () => {
    const pasted = '{"pasted": "into A"}';
    vi.stubGlobal('navigator', {
      clipboard: { readText: vi.fn().mockResolvedValue(pasted), writeText: vi.fn() },
    });
    render(<JsonDiffView />);
    const pasteButtons = screen.getAllByRole('button', { name: /paste/i });
    const jsonAInput = screen.getByRole('textbox', { name: /JSON A input/i });

    fireEvent.click(pasteButtons[0]);

    await waitFor(() => {
      expect(jsonAInput).toHaveValue(pasted);
    });
  });

  it('Paste in JSON B updates the JSON B textarea', async () => {
    const pasted = '{"pasted": "into B"}';
    vi.stubGlobal('navigator', {
      clipboard: { readText: vi.fn().mockResolvedValue(pasted), writeText: vi.fn() },
    });
    render(<JsonDiffView />);
    const pasteButtons = screen.getAllByRole('button', { name: /paste/i });
    const jsonBInput = screen.getByRole('textbox', { name: /JSON B input/i });

    fireEvent.click(pasteButtons[1]);

    await waitFor(() => {
      expect(jsonBInput).toHaveValue(pasted);
    });
  });

  it('Clear in JSON A clears the JSON A textarea', () => {
    render(<JsonDiffView />);
    const jsonAInput = screen.getByRole('textbox', { name: /JSON A input/i });
    const clearButtons = screen.getAllByRole('button', { name: /clear/i });

    fireEvent.click(clearButtons[0]);

    expect(jsonAInput).toHaveValue('');
  });

  it('Clear in JSON B clears the JSON B textarea', () => {
    render(<JsonDiffView />);
    const jsonBInput = screen.getByRole('textbox', { name: /JSON B input/i });
    const clearButtons = screen.getAllByRole('button', { name: /clear/i });

    fireEvent.click(clearButtons[1]);

    expect(jsonBInput).toHaveValue('');
  });

  it('renders JSON A and JSON B input areas', () => {
    render(<JsonDiffView />);
    expect(screen.getByRole('textbox', { name: /JSON A input/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /JSON B input/i })).toBeInTheDocument();
  });

  it('renders diff output region', () => {
    render(<JsonDiffView />);
    expect(screen.getByRole('region', { name: /JSON diff result/i })).toBeInTheDocument();
  });

  it('shows diff output when both inputs are valid and different', () => {
    render(<JsonDiffView />);
    const leftInput = screen.getByRole('textbox', { name: /JSON A input/i });
    const rightInput = screen.getByRole('textbox', { name: /JSON B input/i });
    fireEvent.change(leftInput, { target: { value: '{"a": 1}' } });
    fireEvent.change(rightInput, { target: { value: '{"a": 2, "b": 3}' } });
    const diffOutput = screen.getByTestId('diff-output');
    expect(diffOutput).toBeInTheDocument();
    const removeLines = screen.queryAllByTestId('diff-line-remove');
    const addLines = screen.queryAllByTestId('diff-line-add');
    const changedLines = screen.queryAllByTestId('diff-line-changed');
    expect(removeLines.length + addLines.length + changedLines.length).toBeGreaterThan(0);
  });

  it('shows same key different value on one row with both sides highlighted', () => {
    render(<JsonDiffView />);
    const leftInput = screen.getByRole('textbox', { name: /JSON A input/i });
    const rightInput = screen.getByRole('textbox', { name: /JSON B input/i });
    fireEvent.change(leftInput, { target: { value: '{"name": "foo", "id": 1}' } });
    fireEvent.change(rightInput, { target: { value: '{"name": "bar", "id": 1}' } });
    const changedLines = screen.getAllByTestId('diff-line-changed');
    expect(changedLines.length).toBeGreaterThan(0);
    const diffOutput = screen.getByTestId('diff-output');
    expect(diffOutput.textContent).toMatch(/"name": "foo"/);
    expect(diffOutput.textContent).toMatch(/"name": "bar"/);
  });

  it('shows only unchanged lines when both inputs are the same', () => {
    render(<JsonDiffView />);
    const leftInput = screen.getByRole('textbox', { name: /JSON A input/i });
    const rightInput = screen.getByRole('textbox', { name: /JSON B input/i });
    const same = '{"x": 1}';
    fireEvent.change(leftInput, { target: { value: same } });
    fireEvent.change(rightInput, { target: { value: same } });
    expect(screen.getByTestId('diff-output')).toBeInTheDocument();
    expect(screen.queryAllByTestId('diff-line-remove')).toHaveLength(0);
    expect(screen.queryAllByTestId('diff-line-add')).toHaveLength(0);
    expect(screen.getAllByTestId('diff-line-unchanged').length).toBeGreaterThan(0);
  });

  it('shows parse error when left JSON is invalid', () => {
    render(<JsonDiffView />);
    const leftInput = screen.getByRole('textbox', { name: /JSON A input/i });
    fireEvent.change(leftInput, { target: { value: '{ invalid }' } });
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThanOrEqual(1);
    expect(alerts.some((el) => el.textContent?.includes('Expected property name'))).toBe(true);
  });
});
