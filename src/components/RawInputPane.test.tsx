import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RawInputPane from './RawInputPane';

describe('RawInputPane', () => {
  const setRawString = vi.fn();

  beforeEach(() => {
    setRawString.mockClear();
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(''),
      },
    });
  });

  it('renders Copy, Paste, and Clear buttons', () => {
    render(<RawInputPane rawString="{}" setRawString={setRawString} />);
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /paste/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('Copy writes rawString to clipboard and shows Copied feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText, readText: vi.fn() } });

    render(<RawInputPane rawString='{"a": 1}' setRawString={setRawString} />);
    const copyBtn = screen.getByRole('button', { name: /copy/i });

    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('{"a": 1}');
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
    });
  });

  it('Paste reads clipboard and calls setRawString', async () => {
    const pastedText = '{"pasted": true}';
    const readText = vi.fn().mockResolvedValue(pastedText);
    vi.stubGlobal('navigator', { clipboard: { readText, writeText: vi.fn() } });

    render(<RawInputPane rawString="" setRawString={setRawString} />);
    const pasteBtn = screen.getByRole('button', { name: /paste/i });

    fireEvent.click(pasteBtn);

    await waitFor(() => {
      expect(readText).toHaveBeenCalled();
    });
    expect(setRawString).toHaveBeenCalledWith(pastedText);
  });

  it('Clear calls setRawString with empty string', () => {
    render(<RawInputPane rawString='{"x": 1}' setRawString={setRawString} />);
    const clearBtn = screen.getByRole('button', { name: /clear/i });

    fireEvent.click(clearBtn);

    expect(setRawString).toHaveBeenCalledWith('');
  });
});
