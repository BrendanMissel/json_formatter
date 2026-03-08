import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  describe('unsaved progress / beforeunload', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('does not add beforeunload listener when state is default', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      render(<App />);
      const beforeunloadCalls = addSpy.mock.calls.filter((c) => c[0] === 'beforeunload');
      expect(beforeunloadCalls).toHaveLength(0);
    });

    it('adds beforeunload listener when format tab has non-default input', async () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      render(<App />);
      const formatPanel = screen.getByRole('tabpanel', { name: 'Format' });
      const formatInput = within(formatPanel).getByRole('textbox');
      fireEvent.change(formatInput, { target: { value: '{"custom": true}' } });
      await waitFor(() => {
        const beforeunloadCalls = addSpy.mock.calls.filter((c) => c[0] === 'beforeunload');
        expect(beforeunloadCalls.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('adds beforeunload listener when diff tab has non-default input', async () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      render(<App />);
      fireEvent.click(screen.getByRole('tab', { name: 'Diff' }));
      const diffA = screen.getByRole('textbox', { name: /A Input/i });
      fireEvent.change(diffA, { target: { value: '{"different": 1}' } });
      await waitFor(() => {
        const beforeunloadCalls = addSpy.mock.calls.filter((c) => c[0] === 'beforeunload');
        expect(beforeunloadCalls.length).toBeGreaterThanOrEqual(1);
      });
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

  it('can add a new Format tab via the add menu', () => {
    render(<App />);
    const addButton = screen.getByRole('button', { name: /add tab/i });
    fireEvent.click(addButton);
    const addFormatItem = screen.getByRole('menuitem', { name: /add format tab/i });
    fireEvent.click(addFormatItem);
    const formatTabs = screen.getAllByRole('tab', { name: /^Format/ });
    expect(formatTabs.length).toBe(2);
    expect(screen.getByRole('tab', { name: 'Format 2' })).toBeInTheDocument();
  });

  it('can rename a Format tab via the edit button', () => {
    render(<App />);
    const renameButton = screen.getByLabelText(/rename format/i);
    fireEvent.click(renameButton);
    const input = screen.getByRole('textbox', { name: /rename tab/i });
    fireEvent.change(input, { target: { value: 'My Config' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('tab', { name: 'My Config' })).toBeInTheDocument();
  });

  it('can close a tab and another tab is selected', () => {
    render(<App />);
    const diffTab = screen.getByRole('tab', { name: 'Diff' });
    fireEvent.click(diffTab);
    const closeDiffButton = screen.getByLabelText(/close diff/i);
    fireEvent.click(closeDiffButton);
    expect(screen.queryByRole('tab', { name: 'Diff' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Format' })).toHaveAttribute('aria-selected', 'true');
  });
});
