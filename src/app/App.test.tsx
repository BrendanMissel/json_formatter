import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('persists Format and Diff state when switching between tools', () => {
    render(<App />);

    // Format tool: enter custom JSON
    const formatTab = screen.getByRole('tab', { name: 'Format' });
    const diffTab = screen.getByRole('tab', { name: 'Diff' });
    expect(formatTab).toHaveAttribute('aria-selected', 'true');

    const formatPanel = screen.getByRole('tabpanel', { name: 'Format' });
    const formatInput = within(formatPanel).getByRole('textbox');
    const formatCustomJson = '{"format": "custom"}';
    fireEvent.change(formatInput, { target: { value: formatCustomJson } });
    expect(formatInput).toHaveValue(formatCustomJson);

    // Switch to Diff and set content
    fireEvent.click(diffTab);
    expect(diffTab).toHaveAttribute('aria-selected', 'true');

    const diffA = screen.getByRole('textbox', { name: /A Input/i });
    const diffB = screen.getByRole('textbox', { name: /B Input/i });
    const diffAContent = '{"a": 1}';
    const diffBContent = '{"b": 2}';
    fireEvent.change(diffA, { target: { value: diffAContent } });
    fireEvent.change(diffB, { target: { value: diffBContent } });
    expect(diffA).toHaveValue(diffAContent);
    expect(diffB).toHaveValue(diffBContent);

    // Switch back to Format: Format content should be unchanged
    fireEvent.click(formatTab);
    const formatPanelAgain = screen.getByRole('tabpanel', { name: 'Format' });
    const formatInputAgain = within(formatPanelAgain).getByRole('textbox');
    expect(formatInputAgain).toHaveValue(formatCustomJson);

    // Switch back to Diff: Diff content should be unchanged
    fireEvent.click(diffTab);
    const diffAAgain = screen.getByRole('textbox', { name: /A Input/i });
    const diffBAgain = screen.getByRole('textbox', { name: /B Input/i });
    expect(diffAAgain).toHaveValue(diffAContent);
    expect(diffBAgain).toHaveValue(diffBContent);
  });
});
