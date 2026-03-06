import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useState } from 'react';
import JsonDiffView, { DEFAULT_LEFT, DEFAULT_RIGHT } from './JsonDiffView';

function JsonDiffViewWrapper() {
  const [leftInput, setLeftInput] = useState(DEFAULT_LEFT);
  const [rightInput, setRightInput] = useState(DEFAULT_RIGHT);
  return (
    <JsonDiffView
      leftInput={leftInput}
      setLeftInput={setLeftInput}
      rightInput={rightInput}
      setRightInput={setRightInput}
    />
  );
}

describe('JsonDiffView', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders Copy and Clear buttons for A and B', () => {
    render(<JsonDiffViewWrapper />);
    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    const clearButtons = screen.getAllByRole('button', { name: /clear/i });
    expect(copyButtons).toHaveLength(2);
    expect(clearButtons).toHaveLength(2);
  });

  it('Clear in A clears the A textarea', () => {
    render(<JsonDiffViewWrapper />);
    const jsonAInput = screen.getByRole('textbox', { name: /A Input/i });
    const clearButtons = screen.getAllByRole('button', { name: /clear/i });

    fireEvent.click(clearButtons[0]);

    expect(jsonAInput).toHaveValue('');
  });

  it('Clear in B clears the B textarea', () => {
    render(<JsonDiffViewWrapper />);
    const jsonBInput = screen.getByRole('textbox', { name: /B Input/i });
    const clearButtons = screen.getAllByRole('button', { name: /clear/i });

    fireEvent.click(clearButtons[1]);

    expect(jsonBInput).toHaveValue('');
  });

  it('renders A and B input areas', () => {
    render(<JsonDiffViewWrapper />);
    expect(screen.getByRole('textbox', { name: /A Input/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /B Input/i })).toBeInTheDocument();
  });

  it('renders diff output region', () => {
    render(<JsonDiffViewWrapper />);
    expect(screen.getByRole('region', { name: /JSON diff result/i })).toBeInTheDocument();
  });

  it('shows diff output when both inputs are valid and different', () => {
    render(<JsonDiffViewWrapper />);
    const leftInput = screen.getByRole('textbox', { name: /A Input/i });
    const rightInput = screen.getByRole('textbox', { name: /B Input/i });
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
    render(<JsonDiffViewWrapper />);
    const leftInput = screen.getByRole('textbox', { name: /A Input/i });
    const rightInput = screen.getByRole('textbox', { name: /B Input/i });
    fireEvent.change(leftInput, { target: { value: '{"name": "foo", "id": 1}' } });
    fireEvent.change(rightInput, { target: { value: '{"name": "bar", "id": 1}' } });
    const changedLines = screen.getAllByTestId('diff-line-changed');
    expect(changedLines.length).toBeGreaterThan(0);
    const diffOutput = screen.getByTestId('diff-output');
    expect(diffOutput.textContent).toMatch(/"name": "foo"/);
    expect(diffOutput.textContent).toMatch(/"name": "bar"/);
  });

  it('shows only unchanged lines when both inputs are the same', () => {
    render(<JsonDiffViewWrapper />);
    const leftInput = screen.getByRole('textbox', { name: /A Input/i });
    const rightInput = screen.getByRole('textbox', { name: /B Input/i });
    const same = '{"x": 1}';
    fireEvent.change(leftInput, { target: { value: same } });
    fireEvent.change(rightInput, { target: { value: same } });
    expect(screen.getByTestId('diff-output')).toBeInTheDocument();
    expect(screen.queryAllByTestId('diff-line-remove')).toHaveLength(0);
    expect(screen.queryAllByTestId('diff-line-add')).toHaveLength(0);
    expect(screen.getAllByTestId('diff-line-unchanged').length).toBeGreaterThan(0);
  });

  it('shows parse error when left JSON is invalid', () => {
    render(<JsonDiffViewWrapper />);
    const leftInput = screen.getByRole('textbox', { name: /A Input/i });
    fireEvent.change(leftInput, { target: { value: '{ invalid }' } });
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThanOrEqual(1);
    expect(alerts.some((el) => el.textContent?.includes('Expected property name'))).toBe(true);
  });

  it('dropping a valid JSON file on pane A updates the A input', async () => {
    const content = '{"left": true}';
    const file = new File([content], 'a.json', { type: 'application/json' });
    render(<JsonDiffViewWrapper />);
    const dropZoneA = screen.getByTestId('diff-drop-zone-a');
    const leftInput = screen.getByRole('textbox', { name: /A Input/i });

    fireEvent.drop(dropZoneA, { dataTransfer: { files: [file] } });

    await waitFor(() => {
      expect(leftInput).toHaveValue(content);
    });
  });

  it('dropping a valid JSON file on pane B updates the B input', async () => {
    const content = '{"right": true}';
    const file = new File([content], 'b.json', { type: 'application/json' });
    render(<JsonDiffViewWrapper />);
    const dropZoneB = screen.getByTestId('diff-drop-zone-b');
    const rightInput = screen.getByRole('textbox', { name: /B Input/i });

    fireEvent.drop(dropZoneB, { dataTransfer: { files: [file] } });

    await waitFor(() => {
      expect(rightInput).toHaveValue(content);
    });
  });

  it('dropping an invalid file on pane A shows error and does not change A input', async () => {
    const file = new File(['{ invalid }'], 'bad.json', {
      type: 'application/json'
    });
    render(<JsonDiffViewWrapper />);
    const dropZoneA = screen.getByTestId('diff-drop-zone-a');
    const leftInput = screen.getByRole('textbox', { name: /A Input/i });
    const initialValue = (leftInput as HTMLTextAreaElement).value;

    fireEvent.drop(dropZoneA, { dataTransfer: { files: [file] } });

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.some((el) => el.textContent?.includes('Invalid JSON'))).toBe(true);
    });
    expect(leftInput).toHaveValue(initialValue);
  });
});
